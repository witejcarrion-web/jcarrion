# Sistema de Gestión de Tickets (Helpdesk - osTicket Clone)

Aplicación web 100% online inspirada en el panel de agentes de osTicket para la administración interactiva de tickets en tiempo real, gestionada íntegramente con **Supabase** (Base de datos relacional y Autenticación de usuarios).

## 🚀 Características
- **Inicio de sesión seguro:** Autenticación nativa integrada con agentes mediante Supabase Auth.
- **Filtros rápidos avanzados:** Clasificación por Departamentos, Equipos y Niveles de Prioridad.
- **Pestañas inteligentes:** Gestión separada para tickets "Sin Asignar", "Mis Tickets" y "Historial Completo".
- **Creador manual de Incidencias:** Formulario integrado para dar de alta solicitudes directamente desde el panel de agentes.

## 🛠️ Instalación y Configuración

1. **Clona este repositorio** en tu máquina local o súbelo directamente a tu cuenta de GitHub.
2. Abre la consola de base de datos de tu proyecto en [Supabase](https://supabase.com) (SQL Editor) y ejecuta las sentencias del archivo `database_setup.sql` para crear las tablas relacionales.
3. Abre el archivo `js/app.js` en tu editor de código.
4. Localiza las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` al principio del archivo y reemplázalas con las credenciales de la API de tu proyecto (las encontrarás en *Settings -> API* dentro de Supabase).
5. ¡Listo! Abre el archivo `index.html` en cualquier navegador web o despliega el repositorio gratis en **Vercel** o **Netlify**.
