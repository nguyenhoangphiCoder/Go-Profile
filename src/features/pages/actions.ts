"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { Json } from "@/types/database.generated";
import {
  createPageSchema,
  renameSlugSchema,
  saveDraftSchema,
  publishPageSchema,
  unpublishPageSchema,
  type SaveDraftInput,
  type CreatePageInput,
} from "./schemas";

interface CreatePageResult {
  success: boolean;
  page_id?: string;
  revision_id?: string;
  slug?: string;
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

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_page", {
    p_internal_name: parsed.data.internalName,
    p_slug: parsed.data.slug,
    p_title: parsed.data.title,
  });

  if (error) {
    console.error("Lỗi RPC create_page:", error);
    return {
      success: false,
      error: error.message || "Không thể tạo trang mới",
    };
  }

  const res = data as unknown as CreatePageResult;
  revalidatePath("/admin/pages");
  return {
    success: true,
    pageId: res?.page_id,
    slug: res?.slug,
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
  return {
    success: true,
    newSlug: res?.new_slug,
  };
}

export async function saveDraftAction(input: SaveDraftInput) {
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dữ liệu bản nháp không hợp lệ",
    };
  }

  const supabase = await createSupabaseServerClient();
  const privileged = createSupabaseAdminClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn" };
  }

  const { pageId, draftId, expectedDraftVersion, title, description, theme, seo, blocks } =
    parsed.data;

  // 1. Kiểm tra trạng thái revision hiện tại
  let activeDraftId = draftId;
  let newLockVersion = expectedDraftVersion + 1;

  if (activeDraftId) {
    const { data: rev, error: revErr } = await supabase
      .from("page_revisions")
      .select("id, state, lock_version, revision_no")
      .eq("id", activeDraftId)
      .single();

    if (revErr || !rev) {
      return { success: false, error: "Không tìm thấy bản ghi revision" };
    }

    if (rev.state === "sealed") {
      // Kiểm tra xem trang đã có sẵn một bản nháp (draft) nào chưa
      const { data: existingDraft } = await privileged
        .from("page_revisions")
        .select("id, lock_version")
        .eq("page_id", pageId)
        .eq("state", "draft")
        .maybeSingle();

      if (existingDraft) {
        activeDraftId = existingDraft.id;
        newLockVersion = Number(existingDraft.lock_version) + 1;

        await privileged
          .from("page_revisions")
          .update({
            title,
            description: description || null,
            theme,
            seo,
            lock_version: newLockVersion,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeDraftId);
      } else {
        // Chưa có bản nháp nào -> sinh draft revision mới
        const { data: maxRevData } = await supabase
          .from("page_revisions")
          .select("revision_no")
          .eq("page_id", pageId)
          .order("revision_no", { ascending: false })
          .limit(1)
          .single();

        const nextRevNo = (maxRevData?.revision_no || 1) + 1;

        const { data: newRev, error: newRevErr } = await privileged
          .from("page_revisions")
          .insert({
            page_id: pageId,
            revision_no: nextRevNo,
            state: "draft",
            lock_version: 1,
            title,
            description: description || null,
            theme,
            seo,
            created_by: userData.user.id,
          })
          .select("id, lock_version")
          .single();

        if (newRevErr || !newRev) {
          return { success: false, error: "Không thể khởi tạo bản nháp mới sau xuất bản" };
        }

        activeDraftId = newRev.id;
        newLockVersion = Number(newRev.lock_version);
      }
    } else {
      // Revision đang ở trạng thái draft -> cập nhật nội dung và tăng lock_version
      newLockVersion = Number(rev.lock_version) + 1;

      const { error: updateRevErr } = await privileged
        .from("page_revisions")
        .update({
          title,
          description: description || null,
          theme,
          seo,
          lock_version: newLockVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeDraftId);

      if (updateRevErr) {
        return { success: false, error: "Xung đột phiên bản khi lưu bản nháp" };
      }
    }
  } else {
    // Chưa có draftId -> tạo mới draft
    const { data: maxRevData } = await supabase
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
        title,
        description: description || null,
        theme,
        seo,
        created_by: userData.user.id,
      })
      .select("id, lock_version")
      .single();

    if (newRevErr || !newRev) {
      return { success: false, error: "Không thể tạo bản nháp" };
    }

    activeDraftId = newRev.id;
    newLockVersion = 1;
  }

  // 2. Đồng bộ các khối (page_blocks) & link placements
  // Xóa placements cũ trước, sau đó xóa các blocks cũ của draft này (đảm bảo toàn vẹn khóa ngoại)
  await privileged.from("revision_link_placements").delete().eq("revision_id", activeDraftId);
  await privileged.from("page_blocks").delete().eq("revision_id", activeDraftId);

  // Chuẩn hóa thứ tự position (1, 2, 3...) để không bao giờ trùng lặp constraint (revision_id, position)
  const normalizedBlocks = blocks.map((b, index) => ({
    ...b,
    normalizedPosition: index + 1,
  }));

  if (normalizedBlocks.length > 0) {
    // Thêm các blocks mới (luôn sinh UUID mới cho mỗi revision để không đụng khóa chính với revision đã sealed)
    const blockInsertRows = normalizedBlocks.map((b) => ({
      page_id: pageId,
      revision_id: activeDraftId!,
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
    for (const block of normalizedBlocks) {
      if (block.placements && block.placements.length > 0) {
        const realBlockId = blockIdByPosition.get(block.normalizedPosition);
        if (!realBlockId) continue;

        for (let pIdx = 0; pIdx < block.placements.length; pIdx++) {
          const placement = block.placements[pIdx];
          const placementPosition = pIdx + 1;
          // Đảm bảo có liên kết page_links(page_id, link_id)
          let pageLinkId = placement.pageLinkId;

          if (!pageLinkId) {
            const { data: existingPlk } = await privileged
              .from("page_links")
              .select("id")
              .eq("page_id", pageId)
              .eq("link_id", placement.linkId)
              .is("archived_at", null)
              .maybeSingle();

            if (existingPlk) {
              pageLinkId = existingPlk.id;
            } else {
              const { data: newPlk, error: plkErr } = await privileged
                .from("page_links")
                .insert({
                  page_id: pageId,
                  link_id: placement.linkId,
                })
                .select("id")
                .single();

              if (!plkErr && newPlk) {
                pageLinkId = newPlk.id;
              }
            }
          }

          if (pageLinkId) {
            await privileged.from("revision_link_placements").insert({
              page_id: pageId,
              revision_id: activeDraftId!,
              block_id: realBlockId,
              page_link_id: pageLinkId,
              position: placementPosition,
              label_override: placement.labelOverride || null,
              media_override_id: placement.mediaOverrideId || null,
            });
          }
        }
      }
    }
  }

  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/admin/pages");

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

  return {
    success: true,
    data,
  };
}

export async function duplicatePageAction(sourcePageId: string) {
  const supabase = await createSupabaseServerClient();
  const privileged = createSupabaseAdminClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn" };
  }

  // 1. Lấy thông tin trang nguồn
  const { data: sourcePage, error: pErr } = await supabase
    .from("pages")
    .select(
      `
      internal_name,
      page_slugs(slug, is_current),
      page_revisions!page_revisions_page_id_fkey(id, revision_no, title, description, theme, seo, state)
    `
    )
    .eq("id", sourcePageId)
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
      .select("id")
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (!existing) break;
    suffix += 1;
    candidateSlug = `${primarySlug}-copy-${suffix}`;
  }

  // Chọn revision nguồn: ưu tiên draft, nếu không thì revision mới nhất
  const revs = (sourcePage.page_revisions || []) as unknown as SourceRevisionRow[];
  const sourceRev = revs.find((r) => r.state === "draft") || revs[0];
  const newTitle = sourceRev?.title || newInternalName;

  // 2. Gọi RPC create_page
  const { data: createData, error: createErr } = await supabase.rpc("create_page", {
    p_internal_name: newInternalName,
    p_slug: candidateSlug,
    p_title: newTitle,
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

  revalidatePath("/admin/pages");
  return {
    success: true,
    newPageId,
  };
}

export async function archivePageAction(pageId: string) {
  const privileged = createSupabaseAdminClient();

  const { error } = await privileged
    .from("pages")
    .update({
      archived_at: new Date().toISOString(),
      status: "unpublished",
    })
    .eq("id", pageId);

  if (error) {
    return { success: false, error: "Không thể lưu trữ trang" };
  }

  revalidatePath("/admin/pages");
  return { success: true };
}
