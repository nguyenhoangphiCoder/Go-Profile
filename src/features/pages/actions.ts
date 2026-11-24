"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SITEMAP_TAG } from "@/features/public/sitemap-data";
import { PUBLIC_PAGES_TAG } from "@/features/public/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { Json } from "@/types/database.generated";
import { getWorkspaceForAction } from "@/features/workspace/context";
import { canUseWorkspaceFeature, FEATURE_DISABLED_MESSAGES } from "@/features/workspace/guards";
import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import {
  pageIdSchema,
  createPageSchema,
  renameSlugSchema,
  saveDraftSchema,
  publishPageSchema,
  unpublishPageSchema,
  type SaveDraftInput,
  type CreatePageInput,
} from "./schemas";
import { getLandingTemplate } from "./landing-templates";

const DRAFT_CONFLICT_ERROR =
  "Bản nháp đã được lưu từ một phiên khác. Vui lòng tải lại trang để tránh ghi đè nội dung.";

interface CreatePageResult {
  success: boolean;
  page_id?: string;
  revision_id?: string;
  slug?: string;
  page_kind?: "profile" | "landing";
}

interface RenameSlugResult {
  success: boolean;
  new_slug?: string;
}

interface SourceSlugRow {
  slug: string;
  is_current: boolean;
}

interface SourceRevisionRow {
  id: string;
  revision_no: number;
  title: string;
  description: string | null;
  theme: Json;
  seo: Json;
  state: string;
}

interface PlacementLinkJoin {
  page_link_id: string;
  position: number;
  label_override: string | null;
  media_override_id: string | null;
  page_links: {
    link_id: string;
  } | null;
}

export async function createPageAction(input: CreatePageInput) {
  const parsed = createPageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (parsed.data.pageKind === "landing" && !canUseWorkspaceFeature(ctx, "landing")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.landing };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_page", {
    p_workspace_id: ctx.workspace.id,
    p_internal_name: parsed.data.internalName,
    p_slug: parsed.data.slug,
    p_title: parsed.data.title,
    p_page_kind: parsed.data.pageKind,
  });

  if (error) {
    console.error("Lỗi RPC create_page:", error);
    return {
      success: false,
      error: error.message || "Không thể tạo trang mới",
    };
  }

  const res = data as unknown as CreatePageResult;

  // Nếu tạo Landing Page từ Template dựng sẵn (khác "blank"), tự động nạp bộ section mẫu
  if (
    parsed.data.pageKind === "landing" &&
    parsed.data.templateId &&
    parsed.data.templateId !== "blank" &&
    res?.page_id &&
    res?.revision_id
  ) {
    const template = getLandingTemplate(parsed.data.templateId);
    if (template && template.blocks.length > 0) {
      const privileged = createSupabaseAdminClient();
      await privileged.from("page_blocks").delete().eq("revision_id", res.revision_id);
      const rows = template.blocks.map((b, idx) => ({
        page_id: res.page_id!,
        revision_id: res.revision_id!,
        type: b.type,
        position: idx,
        is_visible: true,
        payload: b.payload as unknown as Json,
      }));
      const { error: tplErr } = await privileged.from("page_blocks").insert(rows);
      if (tplErr) {
        console.error("Lỗi nạp khối template Landing Page:", tplErr);
      }
    }
  }

  revalidatePath("/admin/pages");
  return {
    success: true,
    pageId: res?.page_id,
    slug: res?.slug,
    pageKind: res?.page_kind ?? parsed.data.pageKind,
  };
}

export async function renameSlugAction(
  pageId: string,
  newSlug: string,
  expectedPageVersion: number
) {
  const parsed = renameSlugSchema.safeParse({
    pageId,
    slug: newSlug,
    expectedPageVersion,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Đường dẫn không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("rename_page_slug", {
    p_page_id: parsed.data.pageId,
    p_new_slug: parsed.data.slug,
    p_expected_page_version: parsed.data.expectedPageVersion,
  });

  if (error) {
    console.error("Lỗi RPC rename_page_slug:", error);
    return {
      success: false,
      error: error.message || "Không thể đổi đường dẫn trang",
    };
  }

  const res = data as unknown as RenameSlugResult;
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  revalidateTag(PUBLIC_SITEMAP_TAG, "max");
  revalidateTag(PUBLIC_PAGES_TAG, "max");
  return {
    success: true,
    newSlug: res?.new_slug,
  };
}

/**
 * Đồng bộ bảng revision_media_assets cho một revision (RPC sync_revision_media_assets).
 * Lỗi không chặn việc lưu nháp (ví dụ khi chưa chạy migration 20261116000003), chỉ ghi log.
 */
async function syncRevisionMedia(
  privileged: ReturnType<typeof createSupabaseAdminClient>,
  revisionId: string
) {
  const { error } = await privileged.rpc("sync_revision_media_assets", {
    p_revision_id: revisionId,
  });
  if (error) console.error("Không ghi được danh sách ảnh của bản nháp:", error.message);
}

export async function saveDraftAction(
  input: SaveDraftInput,
  options?: { skipRevalidate?: boolean }
) {
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dữ liệu bản nháp không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const privileged = createSupabaseAdminClient();
  const {
    pageId,
    draftId,
    expectedDraftVersion,
    internalName,
    title,
    description,
    theme,
    seo,
    blocks,
  } = parsed.data;

  const revisionFields = {
    title,
    description: description || null,
    theme,
    seo,
  };

  // 0. Trang phải tồn tại, chưa bị lưu trữ và thuộc workspace hiện tại (service role bỏ qua RLS)
  const { data: pageRow } = await privileged
    .from("pages")
    .select("id, internal_name")
    .eq("id", pageId)
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .maybeSingle();

  if (!pageRow) {
    return { success: false, error: "Trang không tồn tại hoặc đã bị lưu trữ" };
  }

  // Cập nhật tên nội bộ trang nếu có thay đổi (không tăng lock_version để tránh xung đột với đổi slug/xuất bản)
  if (internalName && internalName !== pageRow.internal_name) {
    const { error: nameErr } = await privileged
      .from("pages")
      .update({ internal_name: internalName, updated_at: new Date().toISOString() })
      .eq("id", pageId);
    if (nameErr) {
      console.error("Lỗi cập nhật tên nội bộ trang:", nameErr);
    }
  }

  // 1. Xác định bản nháp đích
  let currentDraft: { id: string; lock_version: number } | null = null;

  if (draftId) {
    const { data: rev } = await privileged
      .from("page_revisions")
      .select("id, page_id, state, lock_version")
      .eq("id", draftId)
      .maybeSingle();

    if (!rev || rev.page_id !== pageId) {
      return { success: false, error: "Không tìm thấy bản ghi revision" };
    }

    if (rev.state === "draft") {
      // Optimistic locking: chặn ghi đè khi bản nháp đã được lưu bởi phiên khác
      if (Number(rev.lock_version) !== expectedDraftVersion) {
        return { success: false, error: DRAFT_CONFLICT_ERROR };
      }
      currentDraft = { id: rev.id, lock_version: Number(rev.lock_version) };
    }
  }

  if (!currentDraft) {
    // Revision đã sealed hoặc chưa có draftId (ví dụ: trang vừa tạo bằng RPC create_page,
    // RPC này đã sinh sẵn 1 bản nháp) -> dùng lại bản nháp hiện có của trang nếu có.
    // Mỗi trang chỉ được phép có 1 draft (unique index uq_page_revisions_draft).
    const { data: existingDraft } = await privileged
      .from("page_revisions")
      .select("id, lock_version")
      .eq("page_id", pageId)
      .eq("state", "draft")
      .maybeSingle();

    if (existingDraft) {
      currentDraft = { id: existingDraft.id, lock_version: Number(existingDraft.lock_version) };
    }
  }

  let activeDraftId: string;
  let newLockVersion: number;

  if (currentDraft) {
    newLockVersion = currentDraft.lock_version + 1;

    const { data: updatedRev, error: updateRevErr } = await privileged
      .from("page_revisions")
      .update({
        ...revisionFields,
        lock_version: newLockVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentDraft.id)
      .eq("state", "draft")
      .eq("lock_version", currentDraft.lock_version)
      .select("id");

    if (updateRevErr) {
      console.error("Lỗi cập nhật bản nháp:", updateRevErr);
      return { success: false, error: "Không thể cập nhật bản nháp" };
    }
    if (!updatedRev || updatedRev.length === 0) {
      return { success: false, error: DRAFT_CONFLICT_ERROR };
    }

    activeDraftId = currentDraft.id;
  } else {
    // Chưa có bản nháp nào -> sinh draft revision mới
    const { data: maxRevData } = await privileged
      .from("page_revisions")
      .select("revision_no")
      .eq("page_id", pageId)
      .order("revision_no", { ascending: false })
      .limit(1);

    const nextRevNo = maxRevData && maxRevData[0] ? maxRevData[0].revision_no + 1 : 1;

    const { data: newRev, error: newRevErr } = await privileged
      .from("page_revisions")
      .insert({
        page_id: pageId,
        revision_no: nextRevNo,
        state: "draft",
        lock_version: 1,
        ...revisionFields,
        created_by: ctx.user.userId,
      })
      .select("id, lock_version")
      .single();

    if (newRevErr || !newRev) {
      console.error("Lỗi tạo bản nháp:", newRevErr);
      return { success: false, error: "Không thể tạo bản nháp" };
    }

    activeDraftId = newRev.id;
    newLockVersion = Number(newRev.lock_version);
  }

  // 2. Đồng bộ các khối (page_blocks) & link placements
  // Xóa placements cũ trước, sau đó xóa các blocks cũ của draft này (đảm bảo toàn vẹn khóa ngoại)
  const { error: delPlacementsErr } = await privileged
    .from("revision_link_placements")
    .delete()
    .eq("revision_id", activeDraftId);
  if (delPlacementsErr) {
    console.error("Lỗi xóa placements cũ:", delPlacementsErr);
    return { success: false, error: "Không thể cập nhật danh sách liên kết của bản nháp" };
  }

  const { error: delBlocksErr } = await privileged
    .from("page_blocks")
    .delete()
    .eq("revision_id", activeDraftId);
  if (delBlocksErr) {
    console.error("Lỗi xóa blocks cũ:", delBlocksErr);
    return { success: false, error: "Không thể cập nhật danh sách khối nội dung" };
  }

  // Chuẩn hóa thứ tự position (1, 2, 3...) để không bao giờ trùng lặp constraint (revision_id, position)
  const normalizedBlocks = blocks.map((b, index) => ({
    ...b,
    normalizedPosition: index + 1,
  }));

  if (normalizedBlocks.length > 0) {
    // Thêm các blocks mới (luôn sinh UUID mới cho mỗi revision để không đụng khóa chính với revision đã sealed)
    const blockInsertRows = normalizedBlocks.map((b) => ({
      page_id: pageId,
      revision_id: activeDraftId,
      type: b.type,
      position: b.normalizedPosition,
      is_visible: b.isVisible,
      payload: b.payload,
    }));

    const { data: insertedBlocks, error: blockErr } = await privileged
      .from("page_blocks")
      .insert(blockInsertRows)
      .select("id, position");

    if (blockErr || !insertedBlocks) {
      console.error("Lỗi lưu blocks:", blockErr);
      return { success: false, error: "Không thể lưu danh sách khối nội dung" };
    }

    // Map lại block ID theo position
    const blockIdByPosition = new Map<number, string>();
    ((insertedBlocks || []) as { id: string; position: number }[]).forEach((ib) => {
      blockIdByPosition.set(ib.position, ib.id);
    });

    // 3. Đồng bộ link placements
    // Tải toàn bộ page_links của trang một lần để: (a) chỉ chấp nhận pageLinkId thuộc đúng trang này,
    // (b) tránh truy vấn lặp cho từng placement.
    const { data: pageLinksData, error: pageLinksErr } = await privileged
      .from("page_links")
      .select("id, link_id, archived_at")
      .eq("page_id", pageId);

    if (pageLinksErr) {
      console.error("Lỗi tải page_links:", pageLinksErr);
      return { success: false, error: "Không thể tải danh sách liên kết của trang" };
    }

    const pageLinkIds = new Set<string>();
    const activePageLinkByLinkId = new Map<string, string>();
    for (const pl of pageLinksData || []) {
      pageLinkIds.add(pl.id);
      if (!pl.archived_at && !activePageLinkByLinkId.has(pl.link_id)) {
        activePageLinkByLinkId.set(pl.link_id, pl.id);
      }
    }

    // Mỗi page_link chỉ được xuất hiện 1 lần trong 1 revision (uq_placements_revision_link)
    const usedPageLinkIds = new Set<string>();

    for (const block of normalizedBlocks) {
      if (!block.placements || block.placements.length === 0) continue;

      const realBlockId = blockIdByPosition.get(block.normalizedPosition);
      if (!realBlockId) continue;

      let placementPosition = 0;
      for (const placement of block.placements) {
        let pageLinkId =
          placement.pageLinkId && pageLinkIds.has(placement.pageLinkId)
            ? placement.pageLinkId
            : activePageLinkByLinkId.get(placement.linkId);

        if (!pageLinkId) {
          const { data: newPlk, error: plkErr } = await privileged
            .from("page_links")
            .insert({
              page_id: pageId,
              link_id: placement.linkId,
            })
            .select("id")
            .single();

          if (plkErr || !newPlk) {
            console.error("Lỗi tạo page_link:", plkErr);
            return {
              success: false,
              error: "Không thể gắn liên kết vào trang (liên kết có thể đã bị xóa)",
            };
          }
          pageLinkId = newPlk.id;
          pageLinkIds.add(newPlk.id);
          activePageLinkByLinkId.set(placement.linkId, newPlk.id);
        }

        if (usedPageLinkIds.has(pageLinkId)) continue;
        usedPageLinkIds.add(pageLinkId);
        placementPosition += 1;

        const { error: placementErr } = await privileged.from("revision_link_placements").insert({
          page_id: pageId,
          revision_id: activeDraftId,
          block_id: realBlockId,
          page_link_id: pageLinkId,
          position: placementPosition,
          label_override: placement.labelOverride || null,
          media_override_id: placement.mediaOverrideId || null,
        });

        if (placementErr) {
          console.error("Lỗi lưu placement:", placementErr);
          return { success: false, error: "Không thể lưu vị trí liên kết trong khối nội dung" };
        }
      }
    }
  }

  // 4. Ghi lại danh sách ảnh bản nháp đang dùng để kho media không cho xoá nhầm
  await syncRevisionMedia(privileged, activeDraftId);

  if (!options?.skipRevalidate) {
    revalidatePath(`/admin/pages/${pageId}`);
    revalidatePath("/admin/pages");
  }

  return {
    success: true,
    draftId: activeDraftId,
    newLockVersion,
  };
}

export async function publishPageAction(
  pageId: string,
  draftId: string,
  expectedPageVersion: number,
  expectedDraftVersion: number
) {
  const parsed = publishPageSchema.safeParse({
    pageId,
    draftId,
    expectedPageVersion,
    expectedDraftVersion,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin xuất bản không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("publish_page", {
    p_page_id: parsed.data.pageId,
    p_draft_id: parsed.data.draftId,
    p_expected_page_version: parsed.data.expectedPageVersion,
    p_expected_draft_version: parsed.data.expectedDraftVersion,
  });

  if (error) {
    console.error("Lỗi RPC publish_page:", error);
    return {
      success: false,
      error: error.message || "Xuất bản trang thất bại",
    };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/", "layout");
  revalidateTag(PUBLIC_SITEMAP_TAG, "max");
  revalidateTag(PUBLIC_PAGES_TAG, "max");

  return {
    success: true,
    data,
  };
}

export async function unpublishPageAction(pageId: string, expectedPageVersion: number) {
  const parsed = unpublishPageSchema.safeParse({
    pageId,
    expectedPageVersion,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("unpublish_page", {
    p_page_id: parsed.data.pageId,
    p_expected_page_version: parsed.data.expectedPageVersion,
  });

  if (error) {
    console.error("Lỗi RPC unpublish_page:", error);
    return {
      success: false,
      error: error.message || "Hủy xuất bản trang thất bại",
    };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/", "layout");
  revalidateTag(PUBLIC_SITEMAP_TAG, "max");
  revalidateTag(PUBLIC_PAGES_TAG, "max");

  return {
    success: true,
    data,
  };
}

export async function duplicatePageAction(sourcePageId: string) {
  if (!pageIdSchema.safeParse(sourcePageId).success) {
    return { success: false, error: "ID trang không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const privileged = createSupabaseAdminClient();

  // 1. Lấy thông tin trang nguồn
  const { data: sourcePage, error: pErr } = await supabase
    .from("pages")
    .select(
      `
      internal_name,
      page_kind,
      published_revision_id,
      page_slugs(slug, is_current),
      page_revisions!page_revisions_page_id_fkey(id, revision_no, title, description, theme, seo, state)
    `
    )
    .eq("id", sourcePageId)
    .eq("workspace_id", ctx.workspace.id)
    .single();

  if (pErr || !sourcePage) {
    return { success: false, error: "Không tìm thấy trang nguồn để nhân bản" };
  }

  const slugs = (sourcePage.page_slugs || []) as unknown as SourceSlugRow[];
  const primarySlug = slugs.find((s) => s.is_current)?.slug || "trang";
  const newInternalName = `${sourcePage.internal_name} (Bản sao)`;

  // Tìm slug duy nhất dạng `${primarySlug}-copy`
  let candidateSlug = `${primarySlug}-copy`;
  let suffix = 1;
  while (true) {
    const { data: existing } = await privileged
      .from("page_slugs")
      .select("slug")
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (!existing) break;
    suffix += 1;
    candidateSlug = `${primarySlug}-copy-${suffix}`;
  }

  // Chọn revision nguồn: ưu tiên bản nháp mới nhất -> bản đang xuất bản -> revision_no lớn nhất
  const revs = [...((sourcePage.page_revisions || []) as unknown as SourceRevisionRow[])].sort(
    (a, b) => Number(b.revision_no) - Number(a.revision_no)
  );
  const sourceRev =
    revs.find((r) => r.state === "draft") ||
    (sourcePage.published_revision_id
      ? revs.find((r) => r.id === sourcePage.published_revision_id)
      : undefined) ||
    revs[0];
  const newTitle = sourceRev?.title || newInternalName;

  // 2. Gọi RPC create_page (giữ nguyên page_kind của trang nguồn)
  const { data: createData, error: createErr } = await supabase.rpc("create_page", {
    p_workspace_id: ctx.workspace.id,
    p_internal_name: newInternalName,
    p_slug: candidateSlug,
    p_title: newTitle,
    p_page_kind: sourcePage.page_kind === "landing" ? "landing" : "profile",
  });

  if (createErr || !createData) {
    return { success: false, error: "Không thể khởi tạo bản sao trang" };
  }

  const createdResult = createData as unknown as CreatePageResult;
  const newPageId = createdResult.page_id!;
  const newDraftId = createdResult.revision_id!;

  // 3. Nếu trang nguồn có revision, sao chép theme, seo, blocks
  if (sourceRev) {
    await privileged
      .from("page_revisions")
      .update({
        theme: sourceRev.theme,
        seo: sourceRev.seo,
        description: sourceRev.description,
      })
      .eq("id", newDraftId);

    // Lấy blocks của revision nguồn
    const { data: sourceBlocks } = await privileged
      .from("page_blocks")
      .select("id, type, position, is_visible, payload")
      .eq("revision_id", sourceRev.id);

    if (sourceBlocks && sourceBlocks.length > 0) {
      // Xóa block mặc định của RPC
      await privileged.from("page_blocks").delete().eq("revision_id", newDraftId);

      for (const sb of sourceBlocks) {
        const { data: newBlock } = await privileged
          .from("page_blocks")
          .insert({
            page_id: newPageId,
            revision_id: newDraftId,
            type: sb.type,
            position: sb.position,
            is_visible: sb.is_visible,
            payload: sb.payload,
          })
          .select("id")
          .single();

        // Sao chép placements nếu có
        if (newBlock) {
          const { data: sourcePlacements } = await privileged
            .from("revision_link_placements")
            .select(
              "page_link_id, position, label_override, media_override_id, page_links(link_id)"
            )
            .eq("revision_id", sourceRev.id)
            .eq("block_id", sb.id);

          const placementsTyped = (sourcePlacements || []) as unknown as PlacementLinkJoin[];

          for (const sp of placementsTyped) {
            const linkId = sp.page_links?.link_id;
            if (!linkId) continue;

            // Tạo page_link cho trang mới
            const { data: newPlk } = await privileged
              .from("page_links")
              .insert({
                page_id: newPageId,
                link_id: linkId,
              })
              .select("id")
              .single();

            if (newPlk) {
              await privileged.from("revision_link_placements").insert({
                page_id: newPageId,
                revision_id: newDraftId,
                block_id: newBlock.id,
                page_link_id: newPlk.id,
                position: sp.position,
                label_override: sp.label_override,
                media_override_id: sp.media_override_id,
              });
            }
          }
        }
      }
    }
  }

  // Bản sao dùng lại ảnh của trang nguồn: ghi nhận để kho media không cho xoá nhầm
  await syncRevisionMedia(privileged, newDraftId);

  revalidatePath("/admin/pages");
  return {
    success: true,
    newPageId,
  };
}

export async function archivePageAction(pageId: string) {
  if (!pageIdSchema.safeParse(pageId).success) {
    return { success: false, error: "ID trang không hợp lệ" };
  }

  // Bắt buộc kiểm tra quyền: action này dùng service-role (bỏ qua RLS) và có thể được gọi
  // trực tiếp qua HTTP POST mà không cần đi qua giao diện admin.
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const privileged = createSupabaseAdminClient();

  const { data: archived, error } = await privileged
    .from("pages")
    .update({
      archived_at: new Date().toISOString(),
      status: "unpublished",
    })
    .eq("id", pageId)
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .select("id");

  if (error) {
    console.error("Lỗi lưu trữ trang:", error);
    return { success: false, error: "Không thể lưu trữ trang" };
  }

  if (!archived || archived.length === 0) {
    return { success: false, error: "Trang không tồn tại hoặc đã được lưu trữ trước đó" };
  }

  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
  revalidateTag(PUBLIC_SITEMAP_TAG, "max");
  revalidateTag(PUBLIC_PAGES_TAG, "max");
  return { success: true };
}

export interface PageRevisionSummary {
  id: string;
  revisionNo: number;
  title: string;
  sealedAt: string | null;
  createdAt: string;
  isPublished: boolean;
  blocksCount: number;
}

/** Lấy danh sách tối đa 20 phiên bản đã niêm phong (sealed) của trang để xem lịch sử & khôi phục. */
export async function listPageRevisionsAction(
  pageId: string
): Promise<
  { success: true; revisions: PageRevisionSummary[] } | { success: false; error: string }
> {
  if (!pageIdSchema.safeParse(pageId).success) {
    return { success: false, error: "ID trang không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("viewer");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const privileged = createSupabaseAdminClient();
  const { data: pageRow } = await privileged
    .from("pages")
    .select("id, published_revision_id")
    .eq("id", pageId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();

  if (!pageRow) {
    return { success: false, error: "Không tìm thấy trang" };
  }

  const { data: revs, error } = await privileged
    .from("page_revisions")
    .select("id, revision_no, title, sealed_at, created_at, page_blocks(id)")
    .eq("page_id", pageId)
    .eq("state", "sealed")
    .order("revision_no", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Lỗi tải lịch sử phiên bản:", error);
    return { success: false, error: "Không thể tải lịch sử phiên bản" };
  }

  const revisions: PageRevisionSummary[] = (revs || []).map((r) => ({
    id: r.id,
    revisionNo: r.revision_no,
    title: r.title || "(Không tiêu đề)",
    sealedAt: r.sealed_at,
    createdAt: r.created_at,
    isPublished: r.id === pageRow.published_revision_id,
    blocksCount: Array.isArray(r.page_blocks) ? r.page_blocks.length : 0,
  }));

  return { success: true, revisions };
}

/** Khôi phục nội dung từ 1 phiên bản sealed cũ vào bản nháp (draft) hiện tại. */
export async function restoreRevisionToDraftAction(
  pageId: string,
  sourceRevisionId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (
    !pageIdSchema.safeParse(pageId).success ||
    !pageIdSchema.safeParse(sourceRevisionId).success
  ) {
    return { success: false, error: "ID không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const privileged = createSupabaseAdminClient();

  const { data: pageRow } = await privileged
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!pageRow) return { success: false, error: "Không tìm thấy trang" };

  const { data: sourceRev } = await privileged
    .from("page_revisions")
    .select("id, title, description, theme, seo")
    .eq("id", sourceRevisionId)
    .eq("page_id", pageId)
    .eq("state", "sealed")
    .maybeSingle();
  if (!sourceRev) return { success: false, error: "Không tìm thấy phiên bản nguồn" };

  // Tìm bản draft hiện tại của trang
  const { data: draftRev } = await privileged
    .from("page_revisions")
    .select("id")
    .eq("page_id", pageId)
    .eq("state", "draft")
    .maybeSingle();

  let targetDraftId = draftRev?.id ?? null;
  if (!targetDraftId) {
    const { data: latest } = await privileged
      .from("page_revisions")
      .select("revision_no")
      .eq("page_id", pageId)
      .order("revision_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: createdDraft, error: cErr } = await privileged
      .from("page_revisions")
      .insert({
        page_id: pageId,
        revision_no: (latest?.revision_no ?? 0) + 1,
        state: "draft",
        title: sourceRev.title,
        description: sourceRev.description,
        theme: sourceRev.theme,
        seo: sourceRev.seo,
      })
      .select("id")
      .single();
    if (cErr || !createdDraft) {
      return { success: false, error: "Không thể tạo bản nháp để khôi phục" };
    }
    targetDraftId = createdDraft.id;
  } else {
    await privileged
      .from("page_revisions")
      .update({
        title: sourceRev.title,
        description: sourceRev.description,
        theme: sourceRev.theme,
        seo: sourceRev.seo,
      })
      .eq("id", targetDraftId);
  }

  // Xóa placements & blocks cũ của draft, nạp lại từ sourceRev
  await privileged.from("revision_link_placements").delete().eq("revision_id", targetDraftId);
  await privileged.from("page_blocks").delete().eq("revision_id", targetDraftId);

  const { data: sourceBlocks } = await privileged
    .from("page_blocks")
    .select("id, type, position, is_visible, payload")
    .eq("revision_id", sourceRev.id)
    .order("position", { ascending: true });

  for (const sb of sourceBlocks || []) {
    const { data: newBlock } = await privileged
      .from("page_blocks")
      .insert({
        page_id: pageId,
        revision_id: targetDraftId,
        type: sb.type,
        position: sb.position,
        is_visible: sb.is_visible,
        payload: sb.payload,
      })
      .select("id")
      .single();

    if (newBlock) {
      const { data: placements } = await privileged
        .from("revision_link_placements")
        .select("page_link_id, position, label_override, media_override_id")
        .eq("revision_id", sourceRev.id)
        .eq("block_id", sb.id);

      if (placements && placements.length > 0) {
        await privileged.from("revision_link_placements").insert(
          placements.map((pl) => ({
            page_id: pageId,
            revision_id: targetDraftId,
            block_id: newBlock.id,
            page_link_id: pl.page_link_id,
            position: pl.position,
            label_override: pl.label_override,
            media_override_id: pl.media_override_id,
          }))
        );
      }
    }
  }

  await syncRevisionMedia(privileged, targetDraftId);
  revalidatePath(`/admin/pages/${pageId}`);
  return { success: true };
}

/** Gán bộ Menu / Site Shell riêng cho 1 trang Landing Page (null = dùng bộ mặc định của workspace). */
export async function updatePageSiteShellAction(
  pageId: string,
  siteShellId: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  if (!pageIdSchema.safeParse(pageId).success) {
    return { success: false, error: "ID trang không hợp lệ" };
  }
  if (siteShellId && !pageIdSchema.safeParse(siteShellId).success) {
    return { success: false, error: "ID bộ Menu không hợp lệ" };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("pages")
    .update({ site_shell_id: siteShellId })
    .eq("id", pageId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi gán bộ Menu cho trang:", error);
    return { success: false, error: error.message || "Không thể đổi bộ Menu cho trang" };
  }

  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/");
  revalidateTag(PUBLIC_PAGES_TAG, "max");
  return { success: true };
}
