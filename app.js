(function () {
  "use strict";
  var C = window.APP_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var form = $("form");

  // ---------- Textos desde config ----------
  $("titulo").textContent = C.TITULO || "Registro";
  document.title = C.TITULO || "Registro";
  $("subtitulo").textContent = C.SUBTITULO || "";
  $("gracias").textContent = C.GRACIAS || "";
  $("gracias").hidden = !C.GRACIAS;
  $("doneGracias").textContent = C.GRACIAS_FINAL || "";
  if (!C.SCRIPT_URL) $("demo").style.display = "block";
  $("politica").textContent =
    "Responsable: " + (C.RESPONSABLE || "el organizador") + ". " +
    "En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, tus datos (nombre, cédula, " +
    "cumpleaños, celular, dirección, puesto de votación y gustos musicales) se usarán únicamente para " +
    "contactarte, informarte sobre actividades y hacer acompañamiento hasta el día de las elecciones. " +
    "No se venderán ni se compartirán con terceros. Como titular puedes conocer, actualizar, rectificar " +
    "o pedir que se borren tus datos, y revocar esta autorización en cualquier momento escribiendo a " +
    (C.CONTACTO || "el contacto del organizador") + ".";

  // ---------- Referido por (link con ?ref=Nombre) ----------
  var params = new URLSearchParams(location.search);
  var ref = (params.get("ref") || "").trim().slice(0, 60);
  if (ref) { $("ref").hidden = false; $("ref").textContent = "Te invitó: " + ref; }

  // ---------- Máscaras para escribir rápido ----------
  function digits(s) { return (s || "").replace(/\D/g, ""); }

  $("cedula").addEventListener("input", function (e) { e.target.value = digits(e.target.value).slice(0, 10); });
  $("mesa").addEventListener("input", function (e) { e.target.value = digits(e.target.value).slice(0, 4); });

  $("telefono").addEventListener("input", function (e) {
    var d = digits(e.target.value);
    if (d.indexOf("57") === 0 && (d.length > 10 || /^\s*\+/.test(e.target.value))) d = d.slice(2);
    d = d.slice(0, 10);
    e.target.value = d.length > 6 ? d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6)
                   : d.length > 3 ? d.slice(0, 3) + " " + d.slice(3) : d;
  });

  // Cumpleaños: día, mes y año separados (evita confundir día/mes)
  $("dia").addEventListener("input", function (e) {
    e.target.value = digits(e.target.value).slice(0, 2);
    if (e.target.value.length === 2) $("mes").focus();
  });
  $("anio").addEventListener("input", function (e) { e.target.value = digits(e.target.value).slice(0, 4); });

  $("genero").addEventListener("change", function (e) {
    var otro = e.target.value === "Otro";
    $("generoOtro").hidden = !otro;
    if (otro) $("generoOtro").focus();
  });

  // ---------- Consultar puesto de votación ----------
  function copiarCedula() {
    var ced = digits($("cedula").value);
    if (ced && navigator.clipboard) navigator.clipboard.writeText(ced).catch(function () {});
    return ced;
  }
  if (C.WHATSAPP_PUESTO) $("consultarWa").hidden = false;
  if (C.URL_CONSULTA_PUESTO) $("consultar").hidden = false;
  $("consultarWa").addEventListener("click", function () {
    var ced = copiarCedula();
    $("puestoHint").hidden = false;
    $("puestoHint").textContent = ced
      ? "Se abrirá el chat de la Registraduría con tu cédula ya escrita: solo dale Enviar. Cuando te responda, vuelve aquí y escribe el puesto y la mesa."
      : "Escribe primero tu cédula arriba para que quede lista en el chat. También puedes dejar el puesto vacío y nosotros lo consultamos.";
    if (!ced) { $("cedula").focus(); return; }
    window.open("https://wa.me/" + C.WHATSAPP_PUESTO + "?text=" + encodeURIComponent(ced), "_blank", "noopener");
  });
  $("consultar").addEventListener("click", function () {
    var ced = copiarCedula();
    $("puestoHint").hidden = false;
    $("puestoHint").textContent = (ced ? "Copiamos tu cédula. Pégala en la página, " : "Escribe tu cédula en la página, ") +
      "mira tu puesto y mesa, y vuelve aquí a escribirlos.";
    window.open(C.URL_CONSULTA_PUESTO, "_blank", "noopener");
  });

  // ---------- Escanear cédula ----------
  var TXT_SCAN = $("scanHint").innerHTML;
  function llenarDesdeCedula(d) {
    $("cedula").value = d.cedula;
    $("nombre").value = d.nombre;
    $("dia").value = d.dia; $("mes").value = d.mes; $("anio").value = d.anio;
    ["cedula", "nombre", "cumpleanos"].forEach(function (k) {
      form.querySelector('[data-f="' + k + '"]').classList.remove("invalid");
    });
    $("scanHint").textContent = "¡Listo! Revisa que tus datos estén bien y completa el resto.";
    $("telefono").focus();
  }
  function errorScan(e) {
    $("scanHint").textContent = e && e.codigo === "formato"
      ? "Leímos el código, pero no parece de una cédula amarilla. Llena los datos a mano, por favor."
      : "No pudimos leer el código. Prueba con buena luz, sin reflejos, acercando la cámara hasta que el código de barras llene la foto. O llena los datos a mano.";
  }
  function pedirFoto() { $("foto").value = ""; $("foto").click(); }

  $("escanear").addEventListener("click", function () {
    if (!window.Escaner) return;
    window.Escaner.escanearCamara().then(function (d) {
      if (d) llenarDesdeCedula(d);
    }).catch(function (e) {
      if (e && e.codigo === "foto") { pedirFoto(); return; }
      if (e && e.codigo === "sincamara") {
        $("scanHint").textContent = "No pudimos abrir la cámara en vivo. Toma una foto del código de barras de atrás de tu cédula.";
        pedirFoto(); return;
      }
      errorScan(e);
    });
  });
  $("tomarFoto").addEventListener("click", pedirFoto);
  $("foto").addEventListener("change", function () {
    var file = $("foto").files && $("foto").files[0];
    if (!file || !window.Escaner) return;
    var b = $("escanear");
    b.disabled = true; b.textContent = "Leyendo la cédula...";
    window.Escaner.escanearFoto(file, function (x) {
      b.textContent = "Leyendo la cédula... " + Math.round(x * 100) + "%";
    }).then(function (d) {
      if (!d) throw new Error("sin datos");
      llenarDesdeCedula(d);
    }).catch(errorScan).then(function () {
      b.disabled = false; b.textContent = "📷 Escanear mi cédula";
    });
  });

  // ---------- Validación ----------
  function parseFecha() {
    var dd = +$("dia").value, mm = +$("mes").value, yy = +$("anio").value;
    if (!dd || !mm || String(yy).length !== 4) return null;
    var dt = new Date(yy, mm - 1, dd);
    if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
    var hoy = new Date();
    var edad = hoy.getFullYear() - yy - ((hoy.getMonth() < mm - 1 || (hoy.getMonth() === mm - 1 && hoy.getDate() < dd)) ? 1 : 0);
    if (edad < 18 || edad > 110) return null;
    return yy + "-" + (mm < 10 ? "0" : "") + mm + "-" + (dd < 10 ? "0" : "") + dd;
  }

  var checks = {
    cedula: function () { return /^\d{6,10}$/.test($("cedula").value); },
    nombre: function () { return $("nombre").value.trim().split(/\s+/).length >= 2; },
    telefono: function () { return /^3\d{9}$/.test(digits($("telefono").value)); },
    cumpleanos: function () { return !!parseFecha(); },
    direccion: function () { return $("direccion").value.trim().length >= 5; },
    genero: function () { return !!$("genero").value; }
  };

  function validar() {
    var primero = null;
    Object.keys(checks).forEach(function (k) {
      var ok = checks[k]();
      var f = form.querySelector('[data-f="' + k + '"]');
      f.classList.toggle("invalid", !ok);
      if (!ok && !primero) primero = f;
    });
    if (primero) {
      primero.scrollIntoView({ behavior: "smooth", block: "center" });
      var inp = primero.querySelector("input,select");
      if (inp) inp.focus({ preventScroll: true });
    }
    return !primero;
  }

  var camposDe = { cumpleanos: ["dia", "mes", "anio"] };
  Object.keys(checks).forEach(function (k) {
    (camposDe[k] || [k]).forEach(function (id) {
      var el = $(id);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () {
        var f = form.querySelector('[data-f="' + k + '"]');
        if (f.classList.contains("invalid")) f.classList.toggle("invalid", !checks[k]());
      });
    });
  });

  function showMsg(txt, ok) {
    var m = $("msg");
    m.textContent = txt;
    m.className = "msg show " + (ok ? "ok" : "bad");
  }

  function titleCase(s) {
    return s.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
  }

  // ---------- Envío ----------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    $("msg").className = "msg";
    if (!validar()) return;

    var genero = $("genero").value === "Otro" && $("generoOtro").value.trim()
      ? "Otro: " + $("generoOtro").value.trim() : $("genero").value;

    var data = {
      cedula: $("cedula").value,
      nombre: titleCase($("nombre").value),
      telefono: digits($("telefono").value),
      cumpleanos: parseFecha(),
      direccion: $("direccion").value.trim(),
      puesto: $("puesto").value.trim() || "Por consultar",
      mesa: $("mesa").value,
      genero: genero,
      referido: ref,
      autoriza: true,
      website: $("website").value
    };

    var btn = $("enviar");
    btn.disabled = true; btn.textContent = "Guardando...";

    var fin = function (resp) {
      btn.disabled = false; btn.textContent = "Registrarme";
      if (resp && resp.ok) {
        $("doneTxt").textContent = resp.actualizado
          ? "Ya estabas registrado, así que actualizamos tus datos. ¡Gracias!"
          : "Tus datos quedaron guardados. Te estaremos contactando.";
        form.style.display = "none";
        $("done").style.display = "block";
        window.scrollTo(0, 0);
      } else {
        showMsg((resp && resp.error) || "No pudimos guardar tus datos. Revisa tu conexión e intenta de nuevo.", false);
      }
    };

    if (!C.SCRIPT_URL) {
      console.log("Modo prueba, datos que se enviarían:", data);
      setTimeout(function () { fin({ ok: true }); }, 500);
      return;
    }

    // text/plain evita el "preflight" CORS, así Apps Script lo recibe sin problemas
    fetch(C.SCRIPT_URL, { method: "POST", body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(fin)
      .catch(function () { fin(null); });
  });

  $("otro").addEventListener("click", function () {
    form.reset();
    $("generoOtro").hidden = true;
    $("scanHint").innerHTML = TXT_SCAN;
    $("puestoHint").hidden = true;
    $("msg").className = "msg";
    $("done").style.display = "none";
    form.style.display = "block";
    window.scrollTo(0, 0);
    $("cedula").focus();
  });
})();
