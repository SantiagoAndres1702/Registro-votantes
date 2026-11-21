# Registro de votantes

Formulario web (pensado para celular) donde las personas registran sus datos.
Cada registro llega a una Google Sheet que tú administras y compartes con los correos que elijas.

- **Formulario:** `index.html` + `app.js`, publicado gratis con GitHub Pages.
- **Configuración:** `config.js` (URL del script, textos y datos del responsable).
- **Backend:** `apps-script/Codigo.gs`, un proyecto de Apps Script que crea y llena la hoja en tu Google Drive.

Si una cédula ya está registrada, se actualiza esa fila en lugar de duplicarla.

## Paso a paso para conectar Google (unos 10 minutos, una sola vez, sirve desde iPhone)

1. **Copia el código.** Abre https://raw.githubusercontent.com/SantiagoAndres1702/registro-votantes/main/apps-script/Codigo.gs, toca y mantén sobre el texto → **Seleccionar todo** → **Copiar**.
2. **Abre Apps Script en modo escritorio.** En Safari entra a https://script.google.com con tu cuenta de Google. Toca el ícono **"aA"** de la barra de direcciones → **Solicitar sitio web de escritorio**.
3. **Crea el proyecto.** Toca **Nuevo proyecto**. Borra lo que aparece en el editor y pega el código. Toca el ícono de guardar 💾.
4. **Crea la hoja.** Arriba, en la lista de funciones, elige **prepararHoja** y toca **Ejecutar**. Google pide permisos:
   *Revisar permisos → tu cuenta → "Configuración avanzada" → "Ir a ... (no seguro)" → Permitir.*
   (Sale "no seguro" solo porque el script es tuyo y Google no lo ha verificado.)
   Abajo, en el **Registro de ejecución**, aparece "LISTO" con el link de tu hoja **Registro votantes**, que también queda en tu Google Drive.
5. **Publica.** Botón azul **Implementar → Nueva implementación** → engranaje ⚙️ → **Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   Toca **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. **Envíame esa URL** y yo la conecto al formulario.
7. **Para que otras personas administren los datos:** abre la hoja en Google Drive → **Compartir** → agrega sus correos como **Editor** (o **Lector** si solo deben ver).

> Si más adelante cambia el código del Apps Script: **Implementar → Administrar implementaciones → lápiz ✏️ → Versión: Nueva versión → Implementar**. Así la URL sigue siendo la misma.

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
