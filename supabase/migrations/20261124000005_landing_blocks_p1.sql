-- Migration: Bổ sung 3 khối Landing Page nâng cao (Gói P1 — Platform CMS)
--   - banner_slider: Banner trượt nhiều ảnh (Slider / Carousel)
--   - testimonials: Đánh giá khách hàng / Đối tác (Testimonials)
--   - cta_banner: Dải kêu gọi hành động nổi bật (CTA Banner)
--
-- Chạy lại nhiều lần an toàn (idempotent, 0-downtime).

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
      -- 14 khối gốc (Profile + Landing dùng chung)
      'header',
      'image',
      'heading',
      'text',
      'link_list',
      'social_icons',
      'spacer',
      'divider',
      'button',
      'gallery',
      'menu_card',
      'accordion',
      'video_embed',
      'map',
      -- 9 khối Landing Page Phase 1-5
      'hero_section',
      'toc_bar',
      'stats_strip',
      'split_content',
      'info_cards',
      'pricing_table',
      'product_grid',
      'store_locator',
      'lead_form',
      -- 3 khối Landing Page nâng cao P1
      'banner_slider',
      'testimonials',
      'cta_banner'
    )
  );
