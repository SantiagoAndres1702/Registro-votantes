// Lector del código de barras (PDF417) del respaldo de la cédula amarilla.
// Todo ocurre en el celular de la persona: ni la imagen ni el video se suben a ningún lado.
(function () {
  "use strict";

  // ---------------- Carga del decodificador ----------------
  var cargando = null;
  function cargarZXing() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (cargando) return cargando;
    cargando = new Promise(function (ok, mal) {
      var s = document.createElement("script");
      s.src = "lib/zxing-0.21.3.min.js";
      s.onload = function () { ok(window.ZXing); };
      s.onerror = function () { cargando = null; mal(new Error("No se pudo cargar el lector")); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  // Lector nativo (Android/Chrome). En iPhone no existe y se usa ZXing.
  var nativo = null;
  function lectorNativo() {
    if (nativo !== null) return Promise.resolve(nativo);
    if (!("BarcodeDetector" in window)) { nativo = false; return Promise.resolve(false); }
    return window.BarcodeDetector.getSupportedFormats().then(function (f) {
      nativo = f.indexOf("pdf417") >= 0 ? new window.BarcodeDetector({ formats: ["pdf417"] }) : false;
      return nativo;
    }).catch(function () { nativo = false; return false; });
  }

  function decodificarZX(Z, canvas, fuerte) {
    var hints = new Map();
    if (fuerte) hints.set(Z.DecodeHintType.TRY_HARDER, true);
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.PDF_417]);
    var fuente = new Z.HTMLCanvasElementLuminanceSource(canvas);
    var bins = fuerte ? [Z.HybridBinarizer, Z.GlobalHistogramBinarizer] : [Z.HybridBinarizer];
    for (var i = 0; i < bins.length; i++) {
      try {
        return new Z.PDF417Reader().decode(new Z.BinaryBitmap(new bins[i](fuente)), hints).getText();
      } catch (e) { /* siguiente */ }
    }
    return null;
  }

  // Dibuja una región de una fuente (imagen o video) en un canvas, con escala y giro
  function recorte(src, sw, sh, r, maxLado, grados) {
    var x = Math.round(r.x * sw), y = Math.round(r.y * sh);
    var w = Math.round(r.w * sw), h = Math.round(r.h * sh);
    var k = Math.min(1, maxLado / Math.max(w, h));
    var dw = Math.round(w * k), dh = Math.round(h * k);
    var c = document.createElement("canvas");
    var rad = grados * Math.PI / 180, cs = Math.abs(Math.cos(rad)), sn = Math.abs(Math.sin(rad));
    c.width = Math.round(dw * cs + dh * sn); c.height = Math.round(dw * sn + dh * cs);
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(grados * Math.PI / 180);
    ctx.drawImage(src, x, y, w, h, -dw / 2, -dh / 2, dw, dh);
    return c;
  }

  // ---------------- Interpretación de los datos ----------------
  function titulo(s) {
    return s.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
  }
  function fechaValida(f) {
    var y = +f.slice(0, 4), m = +f.slice(4, 6), d = +f.slice(6, 8);
    if (y < 1900 || y > new Date().getFullYear()) return false;
    var dt = new Date(y, m - 1, d);
    return dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  function limpiarNombre(s) {
    return (s || "").replace(/[^A-Za-zÑñÁÉÍÓÚáéíóúÜü ]/g, " ").replace(/\s+/g, " ").trim();
  }

  function interpretar(raw) {
    if (!raw) return null;
    var t = raw.replace(/[^\x20-\x7EÑñÁÉÍÓÚáéíóúÜü]/g, "\0").replace(/PubDSK_1/g, "\0\0\0\0\0\0\0\0");
    var m = /(\d{6,10})([A-ZÑ][A-ZÑ\0 ]{1,22})/.exec(t);
    if (!m) return null;
    var cedula = String(+m[1]);
    var p = m.index + m[1].length;

    // Formato de campos fijos (23 caracteres por cada apellido/nombre)
    var bloque = t.substr(p, 102);
    var sexo = bloque.charAt(93), fecha = bloque.substr(94, 8);
    var nombres, apellidos;
    if ((sexo === "M" || sexo === "F") && /^\d{8}$/.test(fecha) && fechaValida(fecha)) {
      apellidos = [bloque.substr(0, 23), bloque.substr(23, 23)].map(limpiarNombre).filter(Boolean);
      nombres = [bloque.substr(46, 23), bloque.substr(69, 23)].map(limpiarNombre).filter(Boolean);
    } else {
      // Respaldo: separa por el relleno y busca sexo + fecha (AAAAMMDD)
      var resto = t.slice(p).replace(/\0+/g, " ");
      var sf = /\s0?([MF])((?:19|20)\d{6})/.exec(resto);
      if (!sf || !fechaValida(sf[2])) return null;
      sexo = sf[1]; fecha = sf[2];
      var tokens = limpiarNombre(resto.slice(0, sf.index)).split(" ").filter(Boolean);
      if (tokens.length < 2) return null;
      if (tokens.length === 2) { apellidos = [tokens[0]]; nombres = [tokens[1]]; }
      else { apellidos = tokens.slice(0, 2); nombres = tokens.slice(2); }
    }
    if (!nombres.length || !apellidos.length) return null;
    return {
      cedula: cedula,
      nombre: titulo(nombres.concat(apellidos).join(" ")),
      dia: fecha.slice(6, 8), mes: fecha.slice(4, 6), anio: fecha.slice(0, 4),
      sexo: sexo
    };
  }

  function pausa() { return new Promise(function (r) { setTimeout(r, 0); }); }

  // ---------------- Desde una foto ----------------
  function leerImagen(file) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); ok(img); };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error("Imagen no válida")); };
      img.src = url;
    });
  }

  // Intentos ordenados: foto completa a buena resolución, luego franjas y recortes
  var REGIONES = [
    { x: 0, y: 0, w: 1, h: 1 },
    { x: 0, y: 0.25, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 },
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0.1, y: 0.3, w: 0.8, h: 0.4 },
    { x: 0.25, y: 0, w: 0.5, h: 1 }
  ];

  function escanearFoto(file, avance) {
    var leido = null;
    return Promise.all([cargarZXing(), leerImagen(file), lectorNativo()]).then(function (r) {
      var Z = r[0], img = r[1], nat = r[2];
      var W = img.naturalWidth, H = img.naturalHeight;
      var intento = function (texto) {
        if (!texto) return null;
        leido = texto;
        return interpretar(texto);
      };
      var cola = [];
      if (nat) cola.push(function () {
        return nat.detect(img).then(function (c) { return c.length ? intento(c[0].rawValue) : null; });
      });
      // El lector solo tolera ~3° de inclinación: probamos varios ángulos
      var base = 0; // normalmente la cédula sale horizontal; luego se prueba girada
      var angulos = [0, -4, 4, -8, 8, -12, 12, -16, 16];
      [base, base === 0 ? 90 : 0].forEach(function (g0, k) {
        REGIONES.slice(0, k ? 2 : REGIONES.length).forEach(function (reg, i) {
          angulos.forEach(function (a) {
            cola.push(function () { return intento(decodificarZX(Z, recorte(img, W, H, reg, 2400, g0 + a), false)); });
          });
        });
      });
      angulos.forEach(function (a) {
        cola.push(function () { return intento(decodificarZX(Z, recorte(img, W, H, REGIONES[0], 1600, base + a), true)); });
      });

      var i = 0;
      function siguiente() {
        if (i >= cola.length) return null;
        if (avance) avance(i / cola.length);
        var f = cola[i++];
        return pausa().then(f).then(function (d) { return d || siguiente(); }).catch(siguiente);
      }
      return siguiente();
    }).then(function (d) {
      if (!d && leido) { var e = new Error("formato"); e.codigo = "formato"; throw e; }
      return d;
    });
  }

  // ---------------- Cámara en vivo ----------------
  var css = "" +
    ".esc-overlay{position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center}.esc-txt{order:-1;margin:0 16px 18px!important;z-index:2;text-shadow:0 1px 3px #000}.esc-bar{z-index:2}" +
    ".esc-overlay video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".esc-guia{position:relative;width:92%;aspect-ratio:3.4/1;border:3px solid #22c55e;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.55)}" +
    ".esc-txt{position:relative;color:#fff;text-align:center;font:600 1rem system-ui;margin:18px 16px 0;max-width:420px}" +
    ".esc-bar{position:absolute;bottom:24px;left:16px;right:16px;display:flex;gap:10px}" +
    ".esc-bar button{flex:1;padding:14px;border-radius:12px;border:0;font:700 1rem system-ui}" +
    ".esc-cerrar{background:#fff;color:#111}.esc-foto{background:#22c55e;color:#fff}";

  function escanearCamara(opciones) {
    opciones = opciones || {};
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(Object.assign(new Error("sin cámara"), { codigo: "sincamara" }));
    }
    if (!document.getElementById("esc-css")) {
      var st = document.createElement("style"); st.id = "esc-css"; st.textContent = css; document.head.appendChild(st);
    }
    var ov = document.createElement("div");
    ov.className = "esc-overlay";
    ov.innerHTML = '<video playsinline muted autoplay></video>' +
      '<div class="esc-guia"></div>' +
      '<div class="esc-txt">Voltea la cédula y pon el <b>código de barras</b> dentro del recuadro verde. Acércala hasta que llene el recuadro y se vea nítido.</div>' +
      '<div class="esc-bar"><button class="esc-cerrar" type="button">Cancelar</button>' +
      '<button class="esc-foto" type="button">Mejor tomar foto</button></div>';
    document.body.appendChild(ov);
    var video = ov.querySelector("video");
    var txt = ov.querySelector(".esc-txt");
    var stream = null, vivo = true, leido = null;

    function cerrar() {
      vivo = false;
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }

    return new Promise(function (ok, mal) {
      ov.querySelector(".esc-cerrar").onclick = function () { cerrar(); ok(null); };
      ov.querySelector(".esc-foto").onclick = function () { cerrar(); mal(Object.assign(new Error("foto"), { codigo: "foto" })); };

      Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } }
        }),
        cargarZXing(),
        lectorNativo()
      ]).then(function (r) {
        stream = r[0];
        var Z = r[1], nat = r[2];
        var track = stream.getVideoTracks()[0];
        try { // enfoque continuo donde se pueda
          var cap = track.getCapabilities ? track.getCapabilities() : {};
          if (cap.focusMode && cap.focusMode.indexOf("continuous") >= 0) track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
        } catch (e) { /* no pasa nada */ }
        video.srcObject = stream;
        return video.play().then(function () { return [Z, nat]; });
      }).then(function (r) {
        var Z = r[0], nat = r[1], n = 0;
        var inicio = Date.now();
        function ciclo() {
          if (!vivo) return;
          var vw = video.videoWidth, vh = video.videoHeight;
          if (!vw) { setTimeout(ciclo, 200); return; }
          // Región del video que corresponde al recuadro verde (video con object-fit: cover)
          var g = ov.querySelector(".esc-guia").getBoundingClientRect();
          var sw = ov.clientWidth, sh = ov.clientHeight;
          var esc = Math.max(sw / vw, sh / vh);
          var ox = (vw * esc - sw) / 2, oy = (vh * esc - sh) / 2;
          var reg = {
            x: Math.max(0, (g.left + ox) / esc / vw - 0.02),
            y: Math.max(0, (g.top + oy) / esc / vh - 0.04),
            w: Math.min(1, g.width / esc / vw + 0.04),
            h: Math.min(1, g.height / esc / vh + 0.08)
          };
          n++;
          var p;
          if (nat) {
            p = nat.detect(video).then(function (c) { return c.length ? c[0].rawValue : null; });
          } else {
            var ang = [0, -4, 4, -8, 8][n % 5];
            p = Promise.resolve(decodificarZX(Z, recorte(video, vw, vh, reg, 2400, ang), n % 10 === 0));
          }
          p.then(function (texto) {
            if (!vivo) return;
            if (texto) {
              leido = texto;
              var d = interpretar(texto);
              if (d) { cerrar(); ok(d); return; }
              txt.textContent = "Leímos un código pero no parece de una cédula amarilla. Intenta de nuevo.";
            }
            if (Date.now() - inicio > 25000 && !leido) {
              txt.textContent = "Sigue intentando: buena luz, sin reflejos, el código completo dentro del recuadro. O toca \"Mejor tomar foto\".";
            }
            setTimeout(ciclo, nat ? 150 : 60);
          }).catch(function () { setTimeout(ciclo, 200); });
        }
        ciclo();
      }).catch(function (e) {
        cerrar();
        mal(Object.assign(new Error("sin cámara"), { codigo: "sincamara", causa: e }));
      });
    });
  }

  window.Escaner = { escanearFoto: escanearFoto, escanearCamara: escanearCamara, interpretar: interpretar };
})();
