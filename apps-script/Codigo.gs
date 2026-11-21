/**
 * Backend del formulario de registro.
 * Funciona como proyecto independiente en script.google.com (sirve desde el celular):
 * al ejecutar prepararHoja() se crea la hoja "Registro votantes" en tu Google Drive.
 * También funciona pegado dentro de una hoja (Extensiones > Apps Script).
 * Guarda cada registro en la pestaña "Registros". Si la cédula ya existe,
 * actualiza esa fila en lugar de duplicarla.
 */
var NOMBRE_ARCHIVO = 'Registro votantes';
// Opcional: si quieres usar una hoja que ya existe, pega aquí su ID
// (el texto largo entre /d/ y /edit en su link). Si lo dejas vacío, se crea una nueva.
var ID_HOJA = '';
var HOJA = 'Registros';
var COLUMNAS = [
  'Fecha de registro', 'Cédula', 'Nombres y apellidos', 'Celular', 'Cumpleaños',
  'Dirección', 'Puesto de votación', 'Mesa', 'Género musical', 'Referido por',
  'Autoriza datos', 'Última actualización', 'Estado de seguimiento', 'Notas'
];
var COL_CEDULA = 2; // columna B

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    if (d.website) return respuesta({ ok: true }); // trampa anti-bots

    var cedula = String(d.cedula || '').replace(/\D/g, '');
    var telefono = String(d.telefono || '').replace(/\D/g, '');
    if (!/^\d{6,10}$/.test(cedula)) return respuesta({ ok: false, error: 'Cédula no válida.' });
    if (!/^3\d{9}$/.test(telefono)) return respuesta({ ok: false, error: 'Celular no válido.' });
    if (d.autoriza !== true) return respuesta({ ok: false, error: 'Falta la autorización de datos.' });
    if (!limpio(d.nombre) || !limpio(d.puesto)) return respuesta({ ok: false, error: 'Faltan datos.' });

    var hoja = obtenerHoja();
    var ahora = new Date();
    var fila = [
      ahora,
      "'" + cedula,
      limpio(d.nombre),
      "'" + telefono,
      limpio(d.cumpleanos),
      limpio(d.direccion),
      limpio(d.puesto),
      limpio(d.mesa),
      limpio(d.genero),
      limpio(d.referido),
      'Sí',
      ahora
    ];

    var existente = buscarCedula(hoja, cedula);
    if (existente) {
      fila[0] = hoja.getRange(existente, 1).getValue(); // conserva la fecha original
      hoja.getRange(existente, 1, 1, fila.length).setValues([fila]);
      return respuesta({ ok: true, actualizado: true });
    }
    hoja.appendRow(fila);
    return respuesta({ ok: true, actualizado: false });
  } catch (err) {
    return respuesta({ ok: false, error: 'Error guardando: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('El formulario está conectado correctamente.');
}

function obtenerLibro() {
  if (ID_HOJA) return SpreadsheetApp.openById(ID_HOJA);
  var activo = SpreadsheetApp.getActiveSpreadsheet && SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('ID_HOJA');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* se borró: se crea otra */ }
  }
  var libro = SpreadsheetApp.create(NOMBRE_ARCHIVO);
  props.setProperty('ID_HOJA', libro.getId());
  return libro;
}

function obtenerHoja() {
  var libro = obtenerLibro();
  var hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#dbeafe');
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    hoja.getRange('E:E').setNumberFormat('dd/mm/yyyy');
    hoja.getRange('L:L').setNumberFormat('dd/mm/yyyy hh:mm');
  }
  return hoja;
}

function buscarCedula(hoja, cedula) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  var valores = hoja.getRange(2, COL_CEDULA, ultima - 1, 1).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).replace(/\D/g, '') === cedula) return i + 2;
  }
  return 0;
}

// Quita espacios, limita el largo y evita que un texto se interprete como fórmula
function limpio(v) {
  var s = String(v == null ? '' : v).trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ejecuta esta función una vez desde el editor: crea la hoja, da los permisos
 * y muestra el link de la hoja en el "Registro de ejecución".
 */
function prepararHoja() {
  var hoja = obtenerHoja();
  var vacia = hoja.getParent().getSheetByName('Hoja 1') || hoja.getParent().getSheetByName('Sheet1');
  if (vacia && hoja.getParent().getSheets().length > 1 && vacia.getLastRow() === 0) hoja.getParent().deleteSheet(vacia);
  Logger.log('LISTO. Tu hoja de registros está aquí: ' + hoja.getParent().getUrl());
}
