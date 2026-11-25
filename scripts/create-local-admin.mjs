const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const ADMIN_EMAIL = process.env.LOCAL_ADMIN_EMAIL || "admin@gocafe.local";
const ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "admin123456";
const ADMIN_NAME = "Admin Local";
const DEFAULT_WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

const authHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function ensureLocalUser() {
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: authHeaders,
  });
  if (!listRes.ok) {
    throw new Error(
      `Không kết nối được Supabase Local (${listRes.status}). Hãy chắc chắn đã chạy pnpm db:start.`
    );
  }
  const listData = await listRes.json();
  const existing = (listData.users || []).find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  if (existing) {
    return existing.id;
  }

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: ADMIN_NAME },
    }),
  });
  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Tạo user local thất bại (${createRes.status}): ${errText}`);
  }
  const created = await createRes.json();
  return created.id;
}

async function upsertRow(table, row, onConflict) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upsert ${table} thất bại (${res.status}): ${errText}`);
  }
}

async function ensurePublicMediaBucket() {
  const getRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/public_media`, {
    headers: authHeaders,
  });
  if (getRes.ok) return;

  const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      id: "public_media",
      name: "public_media",
      public: true,
    }),
  });
  if (!createRes.ok && createRes.status !== 409) {
    const errText = await createRes.text();
    throw new Error(`Tạo bucket public_media thất bại (${createRes.status}): ${errText}`);
  }
}

async function main() {
  const userId = await ensureLocalUser();
  await upsertRow(
    "admin_users",
    { user_id: userId, display_name: ADMIN_NAME, is_active: true },
    "user_id"
  );
  await upsertRow(
    "workspace_members",
    { workspace_id: DEFAULT_WORKSPACE_ID, user_id: userId, role: "owner" },
    "workspace_id,user_id"
  );
  await ensurePublicMediaBucket();

  console.log("Đã sẵn sàng tài khoản Admin Local & bucket public_media:");
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  User ID : ${userId}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
