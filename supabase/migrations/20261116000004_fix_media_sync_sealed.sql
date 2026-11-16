-- Migration: Sửa lỗi ghi nhận ảnh cho phiên bản ĐÃ XUẤT BẢN (sealed)
--
-- Lỗi của migration 20261116000003: trigger trg_revision_media_sealed_guard cấm thêm/xoá dòng
-- revision_media_assets của revision đã niêm phong, nên bước bổ sung dữ liệu cho mọi revision
-- (SELECT sync_revision_media_assets(id) FROM page_revisions) báo lỗi và cả migration bị huỷ
-- — ảnh của trang đã xuất bản không được ghi nhận, vẫn xoá nhầm được.
--
-- Cách sửa: revision_media_assets chỉ là chỉ mục ảnh (dẫn xuất từ nội dung), không phải nội
-- dung trang. Cho phép cập nhật bảng này với revision đã niêm phong KHI VÀ CHỈ KHI đang chạy
-- trong public.sync_revision_media_assets (cờ giao dịch app.media_sync). Nội dung khối và vị trí
-- liên kết của revision đã niêm phong vẫn bất biến như cũ.
-- Chạy lại nhiều lần an toàn; tự chứa — chạy được dù migration 20261116000003 đã chạy hay chưa.

-- 1. Trigger bảo vệ: thêm ngoại lệ cho đồng bộ chỉ mục ảnh
CREATE OR REPLACE FUNCTION public.check_child_of_sealed_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rev_id uuid;
  v_state text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rev_id := OLD.revision_id;
  ELSE
    v_rev_id := NEW.revision_id;
  END IF;

  SELECT state INTO v_state
  FROM public.page_revisions
  WHERE id = v_rev_id;

  IF v_state = 'sealed'
     AND NOT (
       TG_TABLE_NAME = 'revision_media_assets'
       AND current_setting('app.media_sync', true) = 'on'
     ) THEN
    RAISE EXCEPTION 'Không thể thay đổi nội dung (khối/liên kết/media) của revision đã niêm phong (revision: %)', v_rev_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Hàm gom ảnh (giống migration 20261116000003, khai báo lại để migration này tự chứa)
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

-- 3. Hàm đồng bộ: bật cờ app.media_sync trong phạm vi giao dịch rồi tắt lại
CREATE OR REPLACE FUNCTION public.sync_revision_media_assets(p_revision_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.media_sync', 'on', true);

  DELETE FROM public.revision_media_assets WHERE revision_id = p_revision_id;

  INSERT INTO public.revision_media_assets (revision_id, media_asset_id)
  SELECT DISTINCT p_revision_id, m.media_asset_id
  FROM private.revision_media_ids(p_revision_id) m
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  PERFORM set_config('app.media_sync', 'off', true);
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_revision_media_assets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_revision_media_assets(uuid) TO service_role;

-- 4. publish_page ghi đủ ảnh của revision (khai báo lại để migration này tự chứa)
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

-- 5. Bổ sung dữ liệu cho mọi revision (kể cả bản đã xuất bản)
SELECT public.sync_revision_media_assets(id) FROM public.page_revisions;
