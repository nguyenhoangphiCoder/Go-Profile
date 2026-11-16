import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mọi server action ghi dữ liệu phải từ chối khi người dùng không đủ quyền trong workspace
 * hiện tại (viewer / chưa thuộc workspace / hết phiên) — TRƯỚC khi chạm vào database.
 */

const { dbTouched, forbidden } = vi.hoisted(() => {
  const dbTouched = vi.fn();
  const forbidden = () => {
    dbTouched();
    throw new Error("Không được truy cập database khi không đủ quyền");
  };
  return { dbTouched, forbidden };
});

vi.mock("@/features/workspace/context", () => ({
  getWorkspaceForAction: vi.fn(() => Promise.resolve(null)),
  requireWorkspace: vi.fn(() => Promise.reject(new Error("REDIRECT"))),
}));
vi.mock("@/lib/supabase/privileged", () => ({ createSupabaseAdminClient: forbidden }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: forbidden }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import {
  archivePageAction,
  createPageAction,
  duplicatePageAction,
  publishPageAction,
  renameSlugAction,
  saveDraftAction,
  unpublishPageAction,
} from "@/features/pages/actions";
import {
  archiveLinkAction,
  toggleLinkStatusAction,
  upsertLinkAction,
} from "@/features/links/actions";
import { deleteMediaAction, uploadMediaAction } from "@/features/media/actions";
import {
  archiveThemePresetAction,
  listThemePresetsAction,
  saveThemePresetAction,
} from "@/features/theme-presets/actions";

const PAGE = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const DRAFT = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

beforeEach(() => dbTouched.mockClear());

const form = (entries: Record<string, string | Blob>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
};

const cases: [string, () => Promise<{ success?: boolean; error?: string }>][] = [
  ["createPageAction", () => createPageAction({ internalName: "A", slug: "trang-a", title: "A" })],
  ["renameSlugAction", () => renameSlugAction(PAGE, "trang-moi", 1)],
  [
    "saveDraftAction",
    () =>
      saveDraftAction({
        pageId: PAGE,
        expectedDraftVersion: 1,
        title: "T",
        theme: { preset: "go-original" },
        seo: {},
        blocks: [],
      }),
  ],
  ["publishPageAction", () => publishPageAction(PAGE, DRAFT, 1, 1)],
  ["unpublishPageAction", () => unpublishPageAction(PAGE, 1)],
  ["duplicatePageAction", () => duplicatePageAction(PAGE)],
  ["archivePageAction", () => archivePageAction(PAGE)],
  [
    "upsertLinkAction",
    () =>
      upsertLinkAction(
        {},
        form({ defaultLabel: "Menu", targetUrl: "https://x.vn", kind: "http", lockVersion: "1" })
      ),
  ],
  ["toggleLinkStatusAction", () => toggleLinkStatusAction(PAGE, true, 1)],
  ["archiveLinkAction", () => archiveLinkAction(PAGE, 1)],
  [
    "uploadMediaAction",
    () =>
      uploadMediaAction(
        {},
        form({ file: new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }) })
      ),
  ],
  ["deleteMediaAction", () => deleteMediaAction(PAGE)],
  ["listThemePresetsAction", () => listThemePresetsAction()],
  [
    "saveThemePresetAction",
    () =>
      saveThemePresetAction({
        name: "Mẫu",
        config: { preset: "go-original", version: 2, overrides: {} },
      }),
  ],
  ["archiveThemePresetAction", () => archiveThemePresetAction(PAGE)],
];

describe("server action từ chối khi không đủ quyền workspace", () => {
  it.each(cases)("%s", async (_name, run) => {
    const res = await run();
    expect(res.success).toBe(false);
    expect(res.error).toBe(FORBIDDEN_ERROR);
    expect(dbTouched).not.toHaveBeenCalled();
  });
});
