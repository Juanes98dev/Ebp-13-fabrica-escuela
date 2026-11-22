# Guia de despliegue en Render

## Servicios

1. Cree una base de datos PostgreSQL en Render con nombre `bancox-postgres`.
2. Cree el Web Service `bancox-backend` usando el directorio `backend`, el Dockerfile existente y Java 21.
3. Cree el Static Site `bancox-frontend` usando el directorio `frontend`, `npm install && npm run build` y `dist`.

## Variables del backend

- `DATABASE_URL`: URL interna JDBC o URI PostgreSQL proporcionada por Render.
- `JDBC_DATABASE_URL`: opcional. Si se define, reemplaza la URL construida con los datos PostgreSQL.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_SSLMODE`: enlazados automáticamente desde PostgreSQL en `render.yaml`.
- `DB_USER`: usuario de PostgreSQL proporcionado por Render.
- `DB_PASSWORD`: contraseña de PostgreSQL proporcionada por Render.
- `FRONTEND_URL`: URL exacta del Static Site, por ejemplo `https://bancox-frontend.onrender.com`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: datos opcionales del servidor SMTP.

Sin SMTP configurado, el backend registra los correos en la consola y no interrumpe el flujo.

## Variable del frontend

- `VITE_API_URL`: URL publica del backend, por ejemplo `https://bancox-backend.onrender.com`.

## Despliegue

1. Suba los cambios al repositorio.
2. En Render, use `render.yaml` como Blueprint.
3. Complete `FRONTEND_URL` y `VITE_API_URL` con las URLs definitivas.
4. Configure SMTP si necesita envio real.
5. Espere el despliegue de PostgreSQL y luego del backend.
6. Despliegue el Static Site.

El backend escucha en el puerto indicado por Render mediante `PORT`. El frontend incluye `_redirects` para las rutas SPA.
