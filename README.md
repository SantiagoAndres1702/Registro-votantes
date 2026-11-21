# Registro de votantes

Formulario web (pensado para celular) donde las personas registran sus datos.
Cada registro llega a una Google Sheet que tú administras y compartes con los correos que elijas.

- **Formulario:** `index.html` + `app.js`, publicado gratis con GitHub Pages.
- **Configuración:** `config.js` (URL del script, textos y datos del responsable).
- **Backend:** `apps-script/Codigo.gs`, se pega en el Apps Script de tu Google Sheet.

Si una cédula ya está registrada, se actualiza esa fila en lugar de duplicarla.

## Paso a paso para conectar tu Google Sheet (unos 10 minutos, una sola vez)

1. Entra a https://sheets.new con tu cuenta de Google. Ponle un nombre a la hoja, por ejemplo **Registro votantes**.
2. En el menú de arriba: **Extensiones → Apps Script**.
3. Borra todo lo que aparece en el editor y pega el contenido completo de `apps-script/Codigo.gs`. Dale al ícono de guardar 💾.
4. Arriba, en la lista de funciones, elige **prepararHoja** y dale **Ejecutar**. Google pedirá permisos:
   *Revisar permisos → elige tu cuenta → "Configuración avanzada" → "Ir a ... (no seguro)" → Permitir.*
   (Sale como "no seguro" solo porque el script es tuyo y no está verificado por Google.)
   Vuelve a la hoja: verás la pestaña **Registros** con los encabezados.
5. En Apps Script: **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   Dale **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. Envíame esa URL y yo la pongo en `config.js`. (O la pegas tú en `SCRIPT_URL`.)
7. Para que otras personas administren los datos: en la hoja, botón **Compartir**, agrega sus correos como **Editor** (o **Lector** si solo deben ver).

> Si más adelante cambias el código del Apps Script, usa **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión**, así la URL sigue siendo la misma.

## Link para compartir

`https://SantiagoAndres1702.github.io/registro-votantes/`

Para saber quién trajo a cada persona, agrega `?ref=` y el nombre del líder:
`https://SantiagoAndres1702.github.io/registro-votantes/?ref=Carlos`
Ese nombre queda guardado en la columna **Referido por**.

## Sobre el autocompletado con la cédula

La consulta de puesto de votación de la Registraduría tiene captcha y no existe una API pública,
así que no se puede llenar el puesto automáticamente de forma confiable ni legal.
El formulario trae un botón que copia la cédula y abre la consulta oficial para que la persona lo vea en segundos.

## Tratamiento de datos

El formulario incluye la casilla obligatoria de autorización (Ley 1581 de 2012).
Cambia `RESPONSABLE` y `CONTACTO` en `config.js` por los datos reales.
