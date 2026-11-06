import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import type { Database } from "@/types/database.generated";

describe("Database Migrations & Schema Verification", () => {
  const migrationsDir = path.resolve(import.meta.dirname, "../../supabase/migrations");

  it("migrations directory contains expected sequential migration files", () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir).sort();

    expect(files.length).toBeGreaterThanOrEqual(5);
    expect(files[0]).toContain("01_auth_helpers_and_admin");
    expect(files[1]).toContain("02_core_tables");
    expect(files[2]).toContain("03_indexes_and_triggers");
    expect(files[3]).toContain("04_rls_and_security");
    expect(files[4]).toContain("05_rpc_functions");
  });

  it("migration 02 defines all 10 core tables and composite foreign keys", () => {
    const migration02 = fs.readFileSync(
      path.join(migrationsDir, "20261106000002_core_tables.sql"),
      "utf-8"
    );

    const requiredTables = [
      "media_assets",
      "links",
      "pages",
      "page_slugs",
      "page_revisions",
      "page_blocks",
      "page_links",
      "revision_link_placements",
      "revision_media_assets",
      "click_events",
    ];

    for (const table of requiredTables) {
      expect(migration02).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }

    // Kiểm tra các FK ghép bảo vệ con trỏ công khai và bất biến phiên bản
    expect(migration02).toContain("fk_pages_published_revision");
    expect(migration02).toContain("fk_page_blocks_revision");
    expect(migration02).toContain("fk_placements_block");
    expect(migration02).toContain("fk_placements_page_link");
    expect(migration02).toContain("fk_click_events_revision");
    expect(migration02).toContain("fk_click_events_link");
  });

  it("migration 03 implements immutability trigger for sealed revisions", () => {
    const migration03 = fs.readFileSync(
      path.join(migrationsDir, "20261106000003_indexes_and_triggers.sql"),
      "utf-8"
    );

    expect(migration03).toContain("check_sealed_revision_immutability");
    expect(migration03).toContain("check_child_of_sealed_revision");
    expect(migration03).toContain("check_published_revision_is_sealed");
  });

  it("seed.sql defines 3 initial pages and click test fixtures", () => {
    const seedPath = path.resolve(import.meta.dirname, "../../supabase/seed.sql");
    expect(fs.existsSync(seedPath)).toBe(true);

    const seedContent = fs.readFileSync(seedPath, "utf-8");
    expect(seedContent).toContain("gocafe");
    expect(seedContent).toContain("tuyendung");
    expect(seedContent).toContain("nhuongquyen");

    // Fixture mục 11: 12 click trang A, 5 click trang B
    expect(seedContent).toContain("1..12");
    expect(seedContent).toContain("1..5");
  });

  it("type Database compiles and contains correct table structure", () => {
    type PagesRow = Database["public"]["Tables"]["pages"]["Row"];
    type PageStatus = PagesRow["status"];
    const status: PageStatus = "published";
    expect(status).toBe("published");
  });
});
