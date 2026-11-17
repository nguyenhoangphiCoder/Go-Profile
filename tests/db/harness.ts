import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Bộ test database: chạy toàn bộ supabase/migrations trên PGlite (PostgreSQL chạy bằng WASM,
 * không cần Docker). Giả lập phần tối thiểu của Supabase:
 *   - role anon / authenticated / service_role
 *   - schema auth: bảng auth.users + hàm auth.uid() đọc từ request.jwt.claims
 * Dùng `asUser()` để chạy câu lệnh với quyền của một người dùng đã đăng nhập (kiểm tra RLS).
 */

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

const SUPABASE_STUB = `
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  END $$;

  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    email_confirmed_at timestamptz DEFAULT now()
  );
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
  $$;
  GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`;

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function createDb(options: { upTo?: string } = {}): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(SUPABASE_STUB);
  for (const file of migrationFiles()) {
    if (options.upTo && file > options.upTo) break;
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    try {
      await db.exec(sql);
    } catch (err) {
      throw new Error(`Migration ${file} lỗi: ${(err as Error).message}`);
    }
  }
  return db;
}

export async function createUser(
  db: PGlite,
  email: string,
  opts: { confirmed?: boolean } = {}
): Promise<string> {
  const res = await db.query<{ id: string }>(
    "INSERT INTO auth.users (email, email_confirmed_at) VALUES ($1, CASE WHEN $2 THEN now() END) RETURNING id",
    [email, opts.confirmed ?? true]
  );
  return res.rows[0].id;
}

/** Chạy callback với role `authenticated` và auth.uid() = userId, trong transaction riêng. */
export async function asUser<T>(
  db: PGlite,
  userId: string | null,
  fn: (tx: Pick<PGlite, "query" | "exec">) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    const role = userId ? "authenticated" : "anon";
    await tx.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify(userId ? { sub: userId, role } : { role }),
    ]);
    await tx.exec(`SET LOCAL ROLE ${role}`);
    return fn(tx);
  });
}

/** Chạy callback như server action (service role, bỏ qua RLS). */
export async function asService<T>(
  db: PGlite,
  fn: (tx: Pick<PGlite, "query" | "exec">) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec("SET LOCAL ROLE service_role");
    return fn(tx);
  });
}
