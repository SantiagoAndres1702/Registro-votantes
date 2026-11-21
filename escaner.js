// Lector del código de barras (PDF417) del respaldo de la cédula amarilla.
// Todo ocurre en el celular de la persona: la foto no se sube a ningún lado.
(function () {
  "use strict";

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

  function leerImagen(file) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); ok(img); };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error("Imagen no válida")); };
      img.src = url;
    });
  }

  // Dibuja la imagen en un canvas (escalada y rotada)
  function canvasDe(img, maxLado, grados) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var k = Math.min(1, maxLado / Math.max(w, h));
    w = Math.round(w * k); h = Math.round(h * k);
    var c = document.createElement("canvas");
    var rot = grados % 180 !== 0;
    c.width = rot ? h : w; c.height = rot ? w : h;
    var ctx = c.getContext("2d");
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(grados * Math.PI / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return c;
  }

  function decodificar(Z, canvas) {
    var hints = new Map();
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.PDF_417]);
    var fuente = new Z.HTMLCanvasElementLuminanceSource(canvas);
    var binarizadores = [Z.HybridBinarizer, Z.GlobalHistogramBinarizer];
    for (var i = 0; i < binarizadores.length; i++) {
      try {
        var bmp = new Z.BinaryBitmap(new binarizadores[i](fuente));
        return new Z.PDF417Reader().decode(bmp, hints).getText();
      } catch (e) { /* probar siguiente */ }
    }
    return null;
  }

  // ----- Interpretación de los datos de la cédula amarilla -----
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
    // Normaliza caracteres raros a \0 (relleno) conservando posiciones
    var t = raw.replace(/[^\x20-\x7EÑñÁÉÍÓÚáéíóúÜü]/g, "\0");

    // 1) Busca donde empiezan las letras del primer apellido, justo después de la cédula
    var m = /(\d{6,10})([A-ZÑ][A-ZÑ\0 ]{1,22})/.exec(t.replace(/PubDSK_1/g, "\0\0\0\0\0\0\0\0"));
    if (!m) return null;
    var cedula = String(+m[1]);
    var p = m.index + m[1].length;

    // 2a) Formato de campos fijos (23 caracteres cada nombre)
    var bloque = t.substr(p, 102);
    var sexo = bloque.charAt(93), fecha = bloque.substr(94, 8);
    var nombres, apellidos;
    if ((sexo === "M" || sexo === "F") && /^\d{8}$/.test(fecha) && fechaValida(fecha)) {
      apellidos = [bloque.substr(0, 23), bloque.substr(23, 23)].map(limpiarNombre).filter(Boolean);
      nombres = [bloque.substr(46, 23), bloque.substr(69, 23)].map(limpiarNombre).filter(Boolean);
    } else {
      // 2b) Respaldo: separa por relleno y busca sexo+fecha
      var resto = t.slice(p).replace(/\0+/g, " ");
      var sf = /\s0?([MF])(\d{8})/.exec(resto);
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
      cumpleanos: fecha.slice(6, 8) + "/" + fecha.slice(4, 6) + "/" + fecha.slice(0, 4),
      sexo: sexo
    };
  }

  // Intenta leer la foto con varios tamaños y orientaciones
  function escanear(file) {
    return Promise.all([cargarZXing(), leerImagen(file)]).then(function (r) {
      var Z = r[0], img = r[1];
      var tamanos = [2000, 1400, 2800];
      var giros = [0, 90, 270, 180];
      for (var i = 0; i < tamanos.length; i++) {
        for (var j = 0; j < giros.length; j++) {
          var texto = decodificar(Z, canvasDe(img, tamanos[i], giros[j]));
          if (texto) {
            var datos = interpretar(texto);
            if (datos) return datos;
          }
        }
      }
      return null;
    });
  }

  window.Escaner = { escanear: escanear, interpretar: interpretar };
})();
