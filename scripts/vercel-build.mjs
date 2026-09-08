// Build de Vercel: genera el cliente, aplica migraciones y compila.
//
// `prisma migrate deploy` necesita una conexión DIRECTA a Postgres (el pooler
// de Neon / PgBouncer no soporta advisory locks). Si no se definió
// DATABASE_URL_UNPOOLED, la derivamos de DATABASE_URL quitando "-pooler" del host.
import { execSync } from "node:child_process";

const env = { ...process.env };

if (!env.DATABASE_URL_UNPOOLED && env.DATABASE_URL) {
  env.DATABASE_URL_UNPOOLED = env.DATABASE_URL
    .replace("-pooler.", ".")
    .replace(/([?&])pgbouncer=true(&|$)/, "$1")
    .replace(/[?&]$/, "");
  console.log("→ DATABASE_URL_UNPOOLED derivada de DATABASE_URL");
}

// El advisory lock de Prisma da timeouts intermitentes con Neon (P1002).
// En un build de un solo proceso no aporta nada, así que lo desactivamos.
env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "1";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("prisma generate");
run("prisma migrate deploy");
run("next build");
