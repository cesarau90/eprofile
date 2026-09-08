# EProfile — Tarjeta de presentación digital

Plataforma web donde cada estudiante tiene una **EProfile pública** en una ruta propia y
permanente (`/juan-perez`), la administra desde un panel protegido (borrador → vista previa →
publicación) y un **administrador de plataforma** gestiona todas las cuentas y perfiles.

Proyecto académico · Asignatura Nuevas Tecnologías.

---

## 1. Tecnologías utilizadas

| Área | Herramienta |
|---|---|
| Framework | **Next.js 14** (App Router) + **React 18** + **TypeScript** |
| Estilos | **Tailwind CSS 3** (diseño responsivo, foco visible para teclado) |
| Base de datos | **PostgreSQL** vía **Prisma** (Neon / Supabase / Vercel Postgres) |
| ORM | **Prisma 5** |
| Autenticación | Sesión propia con **cookie firmada (JWT `HS256`, `jose`)**, `httpOnly`, `sameSite=lax` |
| Contraseñas | **bcryptjs** (hash con salt, coste 10) — nunca en texto plano |
| CV en PDF | **@react-pdf/renderer** (generación real en el servidor, 3 plantillas) |
| Código QR | **qrcode** (PNG generado en el servidor) |
| vCard | Generador propio `text/vcard` 3.0 |
| Validación | **zod** (mismo esquema en cliente y servidor) |

---

## 2. Requisitos previos

- **Node.js 18.18+** (probado con Node 24).
- Una base de datos **PostgreSQL** y su `DATABASE_URL` (p. ej. una gratis en [neon.tech](https://neon.tech)).

---

## 3. Instalación y ejecución (desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
cp .env.example .env
#    (Windows PowerShell:  Copy-Item .env.example .env)

# 3. Preparar base de datos + datos de demostración
npm run setup       # = prisma generate + prisma db push + seed

# 4. Arrancar en modo desarrollo
npm run dev
```

Abre **http://localhost:3000**

### Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run setup` | Genera el cliente Prisma, crea el esquema en la BD y siembra datos demo |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |
| `npm run db:seed` | Re-siembra los datos de demostración |
| `npm run test` | Pruebas de aceptación (prepara BD + verifica lógica de negocio) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |

---

## 4. Cuentas de prueba

Creadas por el seed. Se pueden cambiar mediante variables de entorno (ver `.env.example`)
o editando `prisma/seed.ts`.

| Rol | Correo | Contraseña | Notas |
|---|---|---|---|
| Administrador de plataforma | `admin@eprofile.test` | `Admin123!` | Panel en `/admin` |
| Estudiante | `juan.perez@eprofile.test` | `Estudiante123!` | Ruta `/juan-perez` — **perfil publicado** |
| Estudiante | `maria.lopez@eprofile.test` | `Estudiante123!` | Ruta `/maria-lopez` — **publicado + borrador pendiente** |

Inicio de sesión: **http://localhost:3000/login**

---

## 5. Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Portada + directorio de EProfiles publicadas |
| `/[slug]` | Público | EProfile pública (portada: foto, nombre, carrera, reseña; luego CV, habilidades, proyectos, contacto) |
| `/[slug]/cv` | Público | CV consultable en pantalla (imprimible) |
| `/[slug]/card` | Público | Tarjeta de presentación imprimible con código QR |
| `/api/p/[slug]/cv` | Público | Descarga del **CV en PDF** (datos publicados + plantilla elegida) |
| `/api/p/[slug]/vcard` | Público | Descarga del contacto en **vCard** (`.vcf`) |
| `/api/p/[slug]/qr` | Público | **QR PNG** que apunta a `/[slug]` |
| `/login` | Público | Inicio de sesión (estudiante y administrador) |
| `/[slug]/admin` | Dueño o admin | Panel del estudiante: editar, guardar borrador, previsualizar, publicar |
| `/[slug]/preview` | Dueño o admin | Vista previa del **borrador** (no visible en público) |
| `/admin` | Solo admin | Alta de cuentas, listado con estado, activar/desactivar/eliminar, reset de contraseña, entrar a cualquier panel |
| `/admin/settings` | Solo admin | Ajustes generales de la plataforma |

---

## 6. Arquitectura

```
src/
  app/
    layout.tsx                 Layout raíz, metadatos, "saltar al contenido"
    page.tsx                   Portada + directorio público
    login/page.tsx             Formulario de acceso (fetch -> /api/auth/login)
    logout/route.ts            Cierra sesión
    [slug]/
      page.tsx                 EProfile PÚBLICA (solo publishedData, solo si la cuenta está activa)
      cv/page.tsx              CV en pantalla
      card/page.tsx            Tarjeta + QR
      preview/page.tsx         Vista previa del borrador (protegida)
      admin/
        page.tsx               Panel del estudiante (server: control de acceso)
        actions.ts             Server Actions: saveDraft / publish / discardDraft
    admin/
      page.tsx                 Panel de plataforma
      AdminClient.tsx          UI del panel (tabla + formularios)
      actions.ts               Server Actions: crear/activar/eliminar cuenta, reset password, ajustes
      settings/                Ajustes de plataforma
    api/
      auth/login/route.ts      POST correo+contraseña -> crea sesión
      p/[slug]/cv|vcard|qr|photo/route.ts   Descargas públicas + subida de foto (protegida)
  components/
    ProfileView.tsx            Render de una EProfile (usado por pública y por preview)
    ProfileEditor.tsx          Editor completo del perfil (cliente)
    ui.tsx                     Botones, campos, alertas, badges, tarjetas
  lib/
    prisma.ts                  Cliente Prisma (singleton)
    auth.ts                    Sesión + guardas: requireUser, requirePlatformAdmin, requireProfileAccess
    password.ts                Hash y verificación (bcrypt) + reglas de contraseña
    profile.ts                 Esquema zod del perfil, estados, reglas de publicación, secciones visibles, slug
    students.ts                Consultas: perfil público, listado para admin
    cv-pdf.tsx                 Generación del PDF (3 plantillas)
    cv-templates.ts            Metadatos de plantillas (compartido cliente/servidor)
    vcard.ts                   Generación de vCard
    settings.ts                Ajustes de plataforma (tabla Setting)
prisma/
  schema.prisma               Esquema
  seed.ts                     Datos de demostración
tests/run.ts                  Pruebas de aceptación
```

### Control de acceso (servidor)

Toda ruta privada se valida **en el servidor** antes de renderizar:

- `requireUser()` — exige sesión válida y cuenta activa; si no, redirige a `/login`.
- `requirePlatformAdmin()` — además exige rol `PLATFORM_ADMIN`.
- `requireProfileAccess(slug)` — permite **solo** al dueño de ese `slug` o a un `PLATFORM_ADMIN`.
  Cualquier otro estudiante es redirigido → **aislamiento entre estudiantes**.

Las Server Actions repiten la misma comprobación (no confían en el cliente).

### Borrador vs. publicado

Cada `Student` guarda dos instantáneas JSON del perfil:

- `draftData` — lo que edita el estudiante (siempre existe).
- `publishedData` — lo que ve el público (`null` = nunca publicado).

**Publicar** copia `draftData → publishedData`. Mientras haya cambios sin publicar, el público
sigue viendo la versión anterior. La EProfile pública, el CV en pantalla, el PDF y la vCard
**siempre** se generan a partir de `publishedData` (información consistente).

No se puede publicar sin al menos **nombre** y **carrera**.

---

## 7. Modelo de datos

```
User
  id            string  (PK)
  email         string  (único)
  passwordHash  string  (bcrypt)
  role          "STUDENT" | "PLATFORM_ADMIN"
  active        boolean          -> cuenta inactiva: su EProfile deja de verse
  student       Student?         (1–1, onDelete: Cascade)

Student
  id            string  (PK)
  slug          string  (único, permanente)   -> ruta pública /{slug}
  userId        string  (único, FK -> User)
  draftData     string  (JSON ProfileData)
  publishedData string? (JSON ProfileData; null = sin publicar)
  publishedAt   datetime?

Setting
  key           string (PK)
  value         string
```

`ProfileData` (JSON, validado con zod en `lib/profile.ts`): `fullName`, `headline`,
`bio`, `photoUrl`, `location`, `contact{email,phone,linkedin,github,website}`,
`education[]`, `experience[]`, `skills[]{category,items[]}`,
`projects[]{name,description,tech,role,url,academic}`, `awards[]`, `cvTemplate`.

---

## 8. Flujo principal

1. **Administrador** inicia sesión en `/admin` y crea la cuenta de un estudiante
   (correo + contraseña inicial + slug único).
2. **Estudiante** inicia sesión en `/[slug]/admin`, completa su información y **guarda borrador**.
3. Revisa el resultado en **`/[slug]/preview`** (no visible al público).
4. Pulsa **Publicar** → su EProfile en `/[slug]` muestra el contenido nuevo.
5. **Visitante** abre `/[slug]` o escanea el QR: ve foto, nombre, carrera y reseña; navega el CV,
   descarga el **PDF**, guarda el contacto (**vCard**). El enlace y el QR no cambian nunca.
6. Si el administrador **desactiva** la cuenta, la EProfile pública deja de mostrarse.

---

## 9. CV en PDF, QR y vCard

- **PDF**: `GET /api/p/[slug]/cv` — generado en el servidor con `@react-pdf/renderer` a partir de
  `publishedData`. El estudiante elige la plantilla (**Clásica / Moderna / Compacta**) en su panel.
- **QR**: `GET /api/p/[slug]/qr` — PNG que codifica `NEXT_PUBLIC_SITE_URL + /[slug]`. Funciona sin sesión.
- **vCard**: `GET /api/p/[slug]/vcard` — `.vcf` 3.0 con nombre, cargo, correo, teléfono, redes y URL pública.
- Las tres salidas usan **exactamente** la misma información publicada.

---

## 10. Fotografías

Las imágenes subidas se guardan en `public/uploads/` (servidas y optimizadas por Next `<Image>` /
`<img>` con tamaño fijo). Validación: JPG/PNG/WebP, máximo 4 MB, solo el dueño o el admin puede subir.

> **En producción** se recomienda sustituir el almacenamiento local por un bucket de objetos
> (S3, Cloudflare R2, Supabase Storage). El punto de cambio es
> `src/app/api/p/[slug]/photo/route.ts` (función `writeFile`) — reemplazar por una subida al bucket
> y guardar la URL pública devuelta.

---

## 11. Base de datos: PostgreSQL

El proyecto usa **PostgreSQL** (`provider = "postgresql"` en `prisma/schema.prisma`).
Tanto en desarrollo como en producción necesitas una cadena de conexión Postgres
(Neon, Supabase, Vercel Postgres o un Postgres local) en `DATABASE_URL`.

```
DATABASE_URL="postgresql://usuario:password@host:5432/eprofile?sslmode=require"
```

Sincroniza el esquema y siembra los datos:

```bash
npx prisma db push
npm run db:seed
```

---

## 12. Despliegue

**Opción A — Vercel + Postgres gestionado (Neon/Supabase/Vercel Postgres):**

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Variables de entorno en Vercel: `DATABASE_URL`, `SESSION_SECRET` (cadena aleatoria larga),
   `NEXT_PUBLIC_SITE_URL` (el dominio final, p. ej. `https://eprofile.vercel.app`).
4. `Build Command` (por defecto `npm run build`) ya ejecuta `prisma db push` contra la BD.
5. Tras el primer despliegue, siembra los datos una vez: `npm run db:seed` localmente
   con `DATABASE_URL` apuntando a la BD de producción.
6. Sustituye el almacenamiento de fotos por un bucket (sección 10).

**Opción B — Servidor propio / Docker:**

```bash
npm ci
npm run build
npx prisma migrate deploy
npm run db:seed          # solo la primera vez
npm start                # escucha en el puerto 3000
```

Pon la app detrás de un proxy inverso con HTTPS (las cookies de sesión usan `Secure` en producción).

---

## 13. Guion breve para la demostración en vivo (≈5 min)

1. **Visitante** (sin sesión): abrir `/juan-perez`. Mostrar portada (foto, nombre, carrera, reseña),
   bajar por experiencia/proyectos (etiqueta "Académico"), **descargar el PDF**, **guardar la vCard**,
   abrir `/juan-perez/card` y **escanear el QR con un celular** → carga la misma EProfile.
2. **Estudiante**: iniciar sesión como `maria.lopez@eprofile.test`. En el panel hay un
   **borrador pendiente**; abrir *Previsualizar* (nueva pestaña) y mostrar que el público en
   `/maria-lopez` todavía **no** ve esos cambios. Pulsar **Publicar** → recargar `/maria-lopez`
   en otra pestaña/dispositivo → los cambios ya aparecen.
3. **Aislamiento**: con la sesión de María, intentar entrar a `/juan-perez/admin` → redirige a login.
4. **Administrador**: iniciar sesión como `admin@eprofile.test`. Crear una cuenta nueva
   (correo + contraseña + slug), mostrar el listado con estado (vacío/borrador/publicado y
   activa/inactiva), **entrar al panel** de esa cuenta, publicar un perfil mínimo y verlo en su ruta.
   **Desactivar** una cuenta y comprobar que su EProfile pública devuelve 404.

---

## 14. Pruebas

```bash
npm run test
```

`tests/run.ts` prepara una base limpia (db push + seed) y verifica: autenticación por roles y
hash de contraseñas, estados de perfil (vacío/borrador/publicado), separación borrador↔publicado,
regla de publicación (nombre + carrera), slug único y válido, aislamiento entre estudiantes,
ocultamiento de perfiles inactivos/sin publicar, secciones vacías ocultas, generación de PDF/QR/vCard
con los datos publicados, persistencia en BD y el flujo completo *crear cuenta → editar → publicar →
visible en su ruta → desactivar → deja de verse*.

Comprobaciones de protección de rutas y aislamiento entre usuarios verificadas también contra el
servidor de producción (`/admin`, `/[slug]/admin`, `/[slug]/preview`, `POST /api/p/[slug]/photo`).

**Resultado de la última ejecución:** `36 pasadas, 0 fallidas` · `npm run typecheck` sin errores ·
`npm run lint` sin avisos · `npm run build` correcto (16 rutas).

---

## 15. Checklist de requisitos

### Obligatorios — cumplidos

- [x] Autenticación por rol (`STUDENT`, `PLATFORM_ADMIN`); cada rol entra a su panel.
- [x] Rutas privadas protegidas **en el servidor**.
- [x] Un estudiante no puede leer ni modificar datos de otro (aislamiento).
- [x] Contraseñas con hash bcrypt; sin secretos en el repositorio; `.env.example` incluido.
- [x] Validación en cliente y servidor (zod compartido).
- [x] Persistencia en base de datos; visible desde cualquier dispositivo.
- [x] EProfile pública por estudiante en ruta única y permanente, sin iniciar sesión.
- [x] Portada con foto, nombre, carrera y reseña antes del resto.
- [x] Formación, experiencia, habilidades por categoría, proyectos (marca "Académico"),
      reconocimientos, LinkedIn, GitHub, correo, teléfono.
- [x] Secciones sin contenido ocultas.
- [x] Descarga de CV en PDF con los datos publicados (verificado que abre y descarga).
- [x] Descarga de contacto en vCard válida.
- [x] Tarjeta de presentación imprimible.
- [x] Código QR a la ruta pública definitiva; funciona sin sesión.
- [x] Panel del estudiante: editar perfil, foto, contacto, formación, experiencia, habilidades,
      proyectos, reconocimientos y enlaces.
- [x] Guardar borrador / previsualizar sin publicar / publicar.
- [x] El contenido público anterior se mantiene mientras haya borrador.
- [x] No se publica sin nombre y carrera.
- [x] Panel del administrador: crear cuentas (correo, contraseña inicial, slug único);
      ver todos los estudiantes; estado del perfil (vacío/borrador/publicado); estado de la cuenta
      (activa/inactiva); desactivar/reactivar; eliminar con confirmación; restablecer contraseña;
      entrar al panel de cualquier estudiante; editar/previsualizar/publicar cualquier perfil;
      ajustes generales.
- [x] Cuenta desactivada: la EProfile pública deja de mostrarse.
- [x] CV en pantalla, EProfile y PDF usan la misma información publicada.
- [x] Diseño responsivo (celular/tableta/escritorio), foco visible para teclado, estados de
      carga/éxito/error/vacío, confirmación antes de eliminar.
- [x] Seed con 1 administrador, 2 estudiantes, 1 perfil publicado y 1 con borrador pendiente,
      con proyectos, habilidades, formación y contacto de ejemplo.

### Punto extra

- [x] Plantillas de CV: 3 estilos (Clásica / Moderna / Compacta) seleccionables desde el panel;
      el PDF se genera con la plantilla elegida y los datos publicados.

### No implementado / fuera de alcance

- [ ] Diagrama Mermaid del flujo (omitido a petición del cliente; el flujo está descrito en la sección 8).
- [ ] Migraciones versionadas de Prisma: se usa `prisma db push` (sincronización directa del esquema).
      Para producción conviene `prisma migrate` — ver sección 11.
- [ ] Restablecimiento de contraseña por autoservicio del estudiante (solo lo hace el administrador).
- [ ] Verificación de correos y recuperación por email (no requerido para el MVP).

---

## 16. Limitaciones conocidas

- **Almacenamiento de fotos local** (`public/uploads/`): válido para desarrollo y demo; en un
  despliegue serverless (Vercel) el sistema de archivos no es persistente — usar un bucket
  (sección 10).
- **SQLite por defecto**: pensado para desarrollo/demostración. Producción multiusuario debe usar
  PostgreSQL (sección 11).
- **Sesión de 7 días** sin refresco deslizante ni revocación individual: al desactivar una cuenta,
  el acceso privado se corta en la siguiente petición (se revalida contra la BD) y la EProfile
  pública deja de verse de inmediato.
- **Optimización de imágenes**: se aplica `next/image` implícito y tamaños fijos; no hay recorte ni
  compresión previa en el servidor.
- **Sin pruebas de interfaz automatizadas** (Playwright/Cypress): la verificación de UI fue manual +
  pruebas de integración a nivel de datos y de rutas.

---

## 17. Referencias

- Next.js — https://nextjs.org/docs
- React — https://react.dev
- Prisma — https://www.prisma.io/docs
- Tailwind CSS — https://tailwindcss.com/docs
- `@react-pdf/renderer` — https://react-pdf.org
- `qrcode` (node-qrcode) — https://github.com/soldair/node-qrcode
- `jose` (JWT/JWS) — https://github.com/panva/jose
- `bcryptjs` — https://github.com/dcodeIO/bcrypt.js
- `zod` — https://zod.dev
- Especificación vCard 3.0 — RFC 2426 — https://datatracker.ietf.org/doc/html/rfc2426
