# MotoBill Pro

Sistema de gestión y facturación para talleres de motocicletas. Incluye clientes, motos, órdenes de trabajo, inventario, cotizaciones, facturas, agenda, reportes y usuarios con roles.

Los datos de ejemplo están marcados como demostración y no representan un taller real.

## Tecnologías

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase: Auth, PostgreSQL (con RLS) y Storage para las fotos de motos
- Modo demostración con `localStorage` cuando no hay variables de Supabase

## Requisitos

- Node.js LTS
- npm

## Instalación y desarrollo

Desde esta carpeta (`motobill-pro`):

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Accesos de demostración (contraseña común `demo1234`):

- Administrador: `admin@demo.motobill`
- Mecánico: `mecanico@demo.motobill`
- Cajero / recepcionista: `cajero@demo.motobill`

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Pruebas de dominio (`node:test`) |
| `npm run build` | Compilación de producción |
| `npm start` | Servir la build |

## Variables de entorno

Copia `.env.example` a `.env.local` y completa solo lo que vayas a usar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (sitemap y enlaces canónicos)
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; permite crear usuarios desde la página de Usuarios)

Sin las variables de Supabase la aplicación funciona en **modo demostración**: los datos se guardan en el navegador.

No subas claves de servicio ni archivos `.env.local`.

## Conexión con Supabase (plan gratuito)

La aplicación detecta las variables públicas y entonces usa Auth, PostgreSQL y Storage reales. Pasos:

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Abre **SQL Editor**, pega el contenido de `supabase/migrations/0001_init.sql` y ejecútalo. Crea las tablas, las políticas RLS, la función `register_workshop` y el bucket `motorcycle-photos`.
3. En **Project Settings → API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca se expone al navegador)
4. Guárdalas en `.env.local` y reinicia `npm run dev`.
5. Entra a `/registro`, crea el taller y ya podrás iniciar sesión con esa cuenta.

Notas:

- Si dejas activa la confirmación por correo (**Authentication → Providers → Email**), hay que confirmar la cuenta antes de entrar.
- Los usuarios nuevos se crean desde **Usuarios**; eso llama a `/api/team`, que usa la clave de servicio.
- Las fotos de motos se guardan en el bucket `motorcycle-photos`; el guardado local (base64) se convierte en URL pública al sincronizar.
- La distribución del panel (dashboard) es una preferencia de interfaz por dispositivo y se guarda en `localStorage` incluso con Supabase.

## Git y GitHub

El proyecto incluye `.gitignore`. Para versionar (cuando lo indiques):

```bash
git init
git add .
git commit -m "Añade MotoBill Pro en modo demostración"
```

No publiques el repositorio ni cambies su visibilidad sin autorización. No hagas `git push` hasta que lo pidas.

## Despliegue en Vercel

No se publica automáticamente. Cuando lo autorices:

1. Ejecuta `npm run build` y confirma que pasa.
2. Conecta el repositorio a Vercel (plan gratuito).
3. Configura las mismas variables de entorno.
4. Despliega y verifica `/`, `/login` y `/app`.

## Limitaciones actuales

- La sincronización es por diferencias y optimista: si dos dispositivos editan el mismo registro a la vez gana la última escritura.
- Los usuarios se crean con contraseña desde la página de Usuarios; todavía no hay recuperación de contraseña ni invitaciones por correo desde la app.
- PDF se genera con Imprimir → Guardar como PDF del navegador (sin servicio de pago).
- El envío de correo abre el cliente de email del usuario (`mailto:`), no un servidor SMTP.
- Las contraseñas del modo demo se almacenan en claro en `localStorage`; no uses datos reales.
- No hay facturación electrónica DIAN ni pasarela de pagos.
