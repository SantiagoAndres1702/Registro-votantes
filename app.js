(function () {
  "use strict";
  var C = window.APP_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var form = $("form");

  // ---------- Textos desde config ----------
  $("titulo").textContent = C.TITULO || "Registro";
  document.title = C.TITULO || "Registro";
  $("subtitulo").textContent = C.SUBTITULO || "";
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
    if (d.indexOf("57") === 0 && d.length > 10) d = d.slice(2);
    d = d.slice(0, 10);
    e.target.value = d.length > 6 ? d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6)
                   : d.length > 3 ? d.slice(0, 3) + " " + d.slice(3) : d;
  });

  $("cumpleanos").addEventListener("input", function (e) {
    var d = digits(e.target.value).slice(0, 8);
    e.target.value = d.length > 4 ? d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4)
                   : d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  });

  $("genero").addEventListener("change", function (e) {
    var otro = e.target.value === "Otro";
    $("generoOtro").hidden = !otro;
    if (otro) $("generoOtro").focus();
  });

  // ---------- Botón: consultar puesto en la Registraduría ----------
  // Solo se muestra si hay un enlace configurado (la consulta oficial se apaga entre elecciones)
  if (C.URL_CONSULTA_PUESTO) $("consultar").hidden = false;
  $("consultar").addEventListener("click", function () {
    var ced = digits($("cedula").value);
    if (ced && navigator.clipboard) {
      navigator.clipboard.writeText(ced).catch(function () {});
      showMsg("Copiamos tu cédula. Pégala en la página de la Registraduría, mira tu puesto y mesa, y vuelve aquí a escribirlos.", true);
    } else {
      showMsg("Se abrirá la página de la Registraduría. Escribe tu cédula, mira tu puesto y mesa, y vuelve aquí a escribirlos.", true);
    }
    window.open(C.URL_CONSULTA_PUESTO, "_blank", "noopener");
  });

  // ---------- Validación ----------
  function parseFecha(s) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
    if (!m) return null;
    var dd = +m[1], mm = +m[2], yy = +m[3];
    var dt = new Date(yy, mm - 1, dd);
    if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
    var hoy = new Date();
    var edad = hoy.getFullYear() - yy - ((hoy.getMonth() < mm - 1 || (hoy.getMonth() === mm - 1 && hoy.getDate() < dd)) ? 1 : 0);
    if (edad < 18 || edad > 110) return null;
    return m[3] + "-" + m[2] + "-" + m[1];
  }

  var checks = {
    cedula: function () { return /^\d{6,10}$/.test($("cedula").value); },
    nombre: function () { return $("nombre").value.trim().split(/\s+/).length >= 2; },
    telefono: function () { return /^3\d{9}$/.test(digits($("telefono").value)); },
    cumpleanos: function () { return !!parseFecha($("cumpleanos").value); },
    direccion: function () { return $("direccion").value.trim().length >= 5; },
    genero: function () { return !!$("genero").value; },
    autoriza: function () { return $("autoriza").checked; }
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

  Object.keys(checks).forEach(function (k) {
    var el = $(k);
    el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", function () {
      var f = form.querySelector('[data-f="' + k + '"]');
      if (f.classList.contains("invalid")) f.classList.toggle("invalid", !checks[k]());
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
      cumpleanos: parseFecha($("cumpleanos").value),
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
    $("msg").className = "msg";
    $("done").style.display = "none";
    form.style.display = "block";
    window.scrollTo(0, 0);
    $("cedula").focus();
  });
})();
