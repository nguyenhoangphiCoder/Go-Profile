-- Migration: Mở rộng loại khối nội dung (giai đoạn 4 — tuỳ biến giao diện)
-- Thêm: button, gallery, menu_card, accordion, video_embed, map.
-- Style riêng của từng khối lưu trong payload.blockStyle nên không cần thêm cột.
-- Các RPC (get_public_page, publish_page) xử lý khối theo cách chung nên không phải sửa.

ALTER TABLE public.page_blocks DROP CONSTRAINT IF EXISTS page_blocks_type_check;

ALTER TABLE public.page_blocks
  ADD CONSTRAINT page_blocks_type_check CHECK (
    type IN (
      'header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider',
      'button', 'gallery', 'menu_card', 'accordion', 'video_embed', 'map'
    )
  );
