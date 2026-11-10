import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const tables = [
  "admin_users",
  "media_assets",
  "links",
  "pages",
  "page_slugs",
  "page_revisions",
  "page_blocks",
  "page_links",
  "revision_link_placements",
  "click_events",
];

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Starting backup to ${backupDir}...`);
  const fullBackup = {};

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select("*", { count: "exact" });
    if (error) {
      console.error(`Error backing up ${table}:`, error.message);
      fullBackup[table] = { error: error.message };
    } else {
      console.log(`✓ ${table}: ${data.length} records`);
      fullBackup[table] = data;
      fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(data, null, 2), "utf8");
    }
  }

  // Also write single combined json
  fs.writeFileSync(path.join(backupDir, "full_backup.json"), JSON.stringify(fullBackup, null, 2), "utf8");

  // Create an SQL restore script
  const sqlStatements = [];
  sqlStatements.push("-- Supabase Restore Backup Script");
  sqlStatements.push(`-- Created at: ${new Date().toISOString()}`);
  sqlStatements.push("BEGIN;\n");

  // We can write insert statements for each table
  for (const table of tables) {
    const rows = fullBackup[table];
    if (Array.isArray(rows) && rows.length > 0) {
      sqlStatements.push(`-- Table: ${table} (${rows.length} rows)`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const colList = cols.map(c => `"${c}"`).join(", ");
        const valList = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          if (typeof val === "boolean" || typeof val === "number") return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(", ");
        sqlStatements.push(`INSERT INTO public.${table} (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;`);
      }
      sqlStatements.push("");
    }
  }

  sqlStatements.push("COMMIT;\n");
  fs.writeFileSync(path.join(backupDir, "restore.sql"), sqlStatements.join("\n"), "utf8");

  console.log(`\nBackup completed successfully! Files saved in: ${backupDir}`);
  return { backupDir, fullBackup };
}

backup().catch(console.error);
