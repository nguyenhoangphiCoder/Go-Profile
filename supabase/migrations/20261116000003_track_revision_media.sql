-- Migration: Ghi nhận đầy đủ ảnh mà mỗi phiên bản trang đang sử dụng (revision_media_assets)
--
-- Vấn đề: trước đây publish_page chỉ ghi ảnh icon của liên kết; avatar, banner, ảnh, thư viện ảnh,
-- ảnh món, ảnh nền theme... không được ghi. Kho media vì vậy cho phép xoá (kèm xoá file trên
-- Storage) cả ảnh đang hiển thị trên trang công khai.
--
-- Cách sửa:
--   1. private.revision_media_ids(): gom mọi ảnh một revision dùng — quét toàn bộ chuỗi trong
--      payload các khối + theme (khớp theo id, object_path hoặc URL public), cộng ảnh của placement.
--   2. public.sync_revision_media_assets(): ghi lại bảng revision_media_assets cho một revision
--      (chỉ service_role gọi được — server action lưu nháp gọi sau khi lưu).
--   3. publish_page dùng hàm trên thay cho phần chỉ ghi ảnh placement.
--   4. Bổ sung dữ liệu cho mọi revision hiện có.
-- Chạy lại nhiều lần an toàn.

CREATE OR REPLACE FUNCTION private.revision_media_ids(p_revision_id uuid)
RETURNS TABLE (media_asset_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH strings AS (
    SELECT s #>> '{}' AS v
    FROM public.page_blocks b
    CROSS JOIN LATERAL jsonb_path_query(b.payload, 'strict $.**') AS s
    WHERE b.revision_id = p_revision_id
      AND jsonb_typeof(s) = 'string'
    UNION
    SELECT s #>> '{}'
    FROM public.page_revisions r
    CROSS JOIN LATERAL jsonb_path_query(r.theme, 'strict $.**') AS s
    WHERE r.id = p_revision_id
      AND jsonb_typeof(s) = 'string'
  )
  SELECT ma.id
  FROM public.media_assets ma
  WHERE EXISTS (
    SELECT 1
    FROM strings st
    WHERE st.v = ma.id::text
       OR st.v = ma.object_path
       OR st.v LIKE '%/' || ma.bucket_id || '/' || ma.object_path
  )
  UNION
  SELECT m
  FROM public.revision_link_placements pl
  CROSS JOIN LATERAL unnest(ARRAY[pl.media_override_id, pl.resolved_media_id]) AS m
  WHERE pl.revision_id = p_revision_id
    AND m IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION private.revision_media_ids(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_revision_media_assets(p_revision_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.revision_media_assets WHERE revision_id = p_revision_id;

  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_revision_id, m.media_asset_id
  FROM private.revision_media_ids(p_revision_id) m
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_revision_media_assets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_revision_media_assets(uuid) TO service_role;

-- publish_page: giữ nguyên logic cũ, chỉ thay phần ghi revision_media_assets
CREATE OR REPLACE FUNCTION public.publish_page(
  p_page_id uuid,
  p_draft_id uuid,
  p_expected_page_version bigint,
  p_expected_draft_version bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page record;
  v_draft record;
BEGIN
  IF NOT private.is_active_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên đang hoạt động mới có quyền xuất bản trang';
  END IF;

  SELECT id, lock_version, status INTO v_page
  FROM public.pages
  WHERE id = p_page_id AND archived_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trang không tồn tại hoặc đã bị lưu trữ';
  END IF;

  IF v_page.lock_version <> p_expected_page_version THEN
    RAISE EXCEPTION 'Xung đột dữ liệu trang (expected version: %, actual: %)', p_expected_page_version, v_page.lock_version;
  END IF;

  SELECT id, lock_version, state, page_id INTO v_draft
  FROM public.page_revisions
  WHERE id = p_draft_id AND page_id = p_page_id
  FOR UPDATE;

  IF NOT FOUND OR v_draft.state IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Bản nháp không hợp lệ hoặc đã được niêm phong trước đó';
  END IF;

  IF v_draft.lock_version <> p_expected_draft_version THEN
    RAISE EXCEPTION 'Xung đột dữ liệu bản nháp (expected version: %, actual: %)', p_expected_draft_version, v_draft.lock_version;
  END IF;

  UPDATE public.revision_link_placements pl
  SET
    resolved_label = COALESCE(pl.label_override, l.default_label),
    resolved_media_id = COALESCE(pl.media_override_id, l.default_media_id),
    updated_at = now()
  FROM public.page_links plk
  JOIN public.links l ON l.id = plk.link_id
  WHERE pl.page_link_id = plk.id
    AND pl.revision_id = p_draft_id;

  -- Ghi toàn bộ ảnh của revision (khối, theme, placement) — trước đây chỉ ghi ảnh placement
  PERFORM public.sync_revision_media_assets(p_draft_id);

  UPDATE public.page_revisions
  SET
    state = 'sealed',
    sealed_at = now(),
    updated_at = now()
  WHERE id = p_draft_id;

  UPDATE public.pages
  SET
    published_revision_id = p_draft_id,
    status = 'published',
    lock_version = lock_version + 1,
    updated_at = now()
  WHERE id = p_page_id;

  RETURN jsonb_build_object(
    'success', true,
    'page_id', p_page_id,
    'published_revision_id', p_draft_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_page(uuid, uuid, bigint, bigint) TO authenticated, service_role;

-- Bổ sung dữ liệu cho mọi revision hiện có
SELECT public.sync_revision_media_assets(id) FROM public.page_revisions;
