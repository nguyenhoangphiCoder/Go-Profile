-- Migration 03: Performance Indexes, Updated_at Triggers & Invariant Protections

-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_page_slugs_page_id ON public.page_slugs(page_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page_history ON public.page_revisions(page_id, revision_no DESC);
CREATE INDEX IF NOT EXISTS idx_page_links_link_page ON public.page_links(link_id, page_id);
CREATE INDEX IF NOT EXISTS idx_placements_page_link_id ON public.revision_link_placements(page_link_id);
CREATE INDEX IF NOT EXISTS idx_revision_media_asset_id ON public.revision_media_assets(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_click_events_page_time ON public.click_events(page_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_click_events_link_time ON public.click_events(link_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_click_events_occurred_at ON public.click_events(occurred_at);

-- 2. Updated_at Triggers
CREATE TRIGGER trg_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_page_revisions_updated_at
  BEFORE UPDATE ON public.page_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_page_blocks_updated_at
  BEFORE UPDATE ON public.page_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_placements_updated_at
  BEFORE UPDATE ON public.revision_link_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 3. Invariant: Bảo vệ tính bất biến của revision sealed
CREATE OR REPLACE FUNCTION public.check_sealed_revision_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.state = 'sealed' THEN
      RAISE EXCEPTION 'Không thể sửa đổi phiên bản đã được niêm phong (sealed revision: %)', OLD.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.state = 'sealed' THEN
      RAISE EXCEPTION 'Không thể xóa phiên bản đã được niêm phong (sealed revision: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_sealed_revision
  BEFORE UPDATE OR DELETE ON public.page_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_sealed_revision_immutability();

-- 4. Invariant: Bảo vệ con của revision sealed không bị sửa/xóa/thêm mới
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

  IF v_state = 'sealed' THEN
    RAISE EXCEPTION 'Không thể thay đổi nội dung (khối/liên kết/media) của revision đã niêm phong (revision: %)', v_rev_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_page_blocks_sealed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.page_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_child_of_sealed_revision();

CREATE TRIGGER trg_placements_sealed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.revision_link_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.check_child_of_sealed_revision();

CREATE TRIGGER trg_revision_media_sealed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.revision_media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_child_of_sealed_revision();

-- 5. Invariant: published_revision_id phải trỏ đến một revision đã sealed
CREATE OR REPLACE FUNCTION public.check_published_revision_is_sealed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state text;
BEGIN
  IF NEW.published_revision_id IS NOT NULL THEN
    SELECT state INTO v_state
    FROM public.page_revisions
    WHERE id = NEW.published_revision_id;

    IF v_state IS DISTINCT FROM 'sealed' THEN
      RAISE EXCEPTION 'Chỉ có thể công khai revision ở trạng thái sealed (revision: %, state: %)', NEW.published_revision_id, v_state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pages_published_revision_sealed_guard
  BEFORE INSERT OR UPDATE OF published_revision_id ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_published_revision_is_sealed();

