-- Migration: Mở rộng loại khối nội dung (giai đoạn 4 — tuỳ biến giao diện)
-- Thêm: button, gallery, menu_card, accordion, video_embed, map.
-- Style riêng của từng khối lưu trong payload.blockStyle nên không cần thêm cột.
-- Các RPC (get_public_page, publish_page) xử lý khối theo cách chung nên không phải sửa.

-- Xoá mọi CHECK constraint cũ giới hạn cột type (tên constraint có thể khác nhau tuỳ cách
-- database được khởi tạo: migrations, production_bootstrap.sql hay full_schema_migration.sql).
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.page_blocks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%link_list%'
  LOOP
    EXECUTE format('ALTER TABLE public.page_blocks DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.page_blocks
  ADD CONSTRAINT page_blocks_type_check CHECK (
    type IN (
      'header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider',
      'button', 'gallery', 'menu_card', 'accordion', 'video_embed', 'map'
    )
  );
