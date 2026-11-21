// =====================================================================
//  CONFIGURACIÓN — este es el único archivo que normalmente hay que tocar
// =====================================================================
window.APP_CONFIG = {
  // Pega aquí la URL de tu Apps Script (termina en /exec).
  // Mientras esté vacía, el formulario funciona en "modo prueba" y no guarda nada.
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycby2HIPCDEO91pblFBVIRqV3isKiPSS24JGTcx14ckaQV6ApjknAlszTQBdZLotfJ42o/exec",

  // Textos que ve la persona al abrir el link
  TITULO: "Únete y registra tus datos",
  SUBTITULO: "Te toma menos de un minuto. Así te mantenemos informado hasta el día de la votación.",

  // Agradecimiento (arriba del formulario y al terminar el registro)
  GRACIAS: "¡Gracias por tu apoyo! Tu colaboración hace la diferencia.",
  GRACIAS_FINAL: "Gracias por sumarte y por tu compromiso. Contamos contigo el día de la votación.",

  // Tratamiento de datos (Ley 1581 de 2012). Cambia estos datos por los reales.
  RESPONSABLE: "[Nombre del responsable]",
  CONTACTO: "[WhatsApp o correo de contacto]",

  // Enlace oficial de la Registraduría para consultar el puesto de votación.
  // La Registraduría solo la habilita en temporada electoral (en nov-2026
  // https://wsp.registraduria.gov.co/censo/consultar/ da error 404).
  // Déjalo vacío para ocultar el botón; ponlo de nuevo cuando vuelva a funcionar.
  URL_CONSULTA_PUESTO: "",
};
