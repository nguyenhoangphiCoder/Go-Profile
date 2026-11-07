-- ==============================================================================
-- Production Bootstrap & Initial Content Seed: Gờ Cafe Profile (Phase 10)
-- Mục đích: Khởi tạo idempotent 3 trang thương hiệu chính trên Production
--           mà KHÔNG chèn bất kỳ dữ liệu click_events kiểm thử nào.
-- Múi giờ: Asia/Ho_Chi_Minh
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  -- Link IDs (Cố định UUID để idempotent khi chạy lại)
  v_link_shopee uuid    := '11111111-1111-1111-1111-111111111111';
  v_link_grab uuid      := '22222222-2222-2222-2222-222222222222';
  v_link_menu uuid      := '33333333-3333-3333-3333-333333333333';
  v_link_maps uuid      := '44444444-4444-4444-4444-444444444444';
  v_link_tel uuid       := '55555555-5555-5555-5555-555555555555';
  v_link_email uuid     := '66666666-6666-6666-6666-666666666666';
  v_link_apply uuid     := '77777777-7777-7777-7777-777777777777';
  v_link_franchise uuid := '88888888-8888-8888-8888-888888888888';

  -- Page IDs
  v_page_brand uuid     := 'a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_page_careers uuid   := 'a2222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_page_franchise uuid := 'a3333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  -- Revision IDs (Sealed Initial Release v1)
  v_rev_brand uuid      := 'b1111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_rev_careers uuid    := 'b2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_rev_franchise uuid  := 'b3333333-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- Block IDs
  v_block_brand_hdr uuid    := 'c1111111-cccc-cccc-cccc-cccccccccccc';
  v_block_brand_list uuid   := 'c2222222-cccc-cccc-cccc-cccccccccccc';
  v_block_careers_hdr uuid  := 'c3333333-cccc-cccc-cccc-cccccccccccc';
  v_block_careers_list uuid := 'c4444444-cccc-cccc-cccc-cccccccccccc';
  v_block_fran_hdr uuid     := 'c5555555-cccc-cccc-cccc-cccccccccccc';
  v_block_fran_list uuid    := 'c6666666-cccc-cccc-cccc-cccccccccccc';

  -- Page Link IDs (Stable Placement Identifiers)
  v_plk_brand_shopee uuid := 'd1111111-dddd-dddd-dddd-dddddddddddd';
  v_plk_brand_grab uuid   := 'd2222222-dddd-dddd-dddd-dddddddddddd';
  v_plk_brand_menu uuid   := 'd3333333-dddd-dddd-dddd-dddddddddddd';
  v_plk_brand_maps uuid   := 'd4444444-dddd-dddd-dddd-dddddddddddd';
  v_plk_brand_tel uuid    := 'd5555555-dddd-dddd-dddd-dddddddddddd';

  v_plk_careers_apply uuid := 'd6666666-dddd-dddd-dddd-dddddddddddd';
  v_plk_careers_email uuid := 'd7777777-dddd-dddd-dddd-dddddddddddd';
  v_plk_careers_menu uuid  := 'd8888888-dddd-dddd-dddd-dddddddddddd';

  v_plk_fran_doc uuid     := 'd9999999-dddd-dddd-dddd-dddddddddddd';
  v_plk_fran_tel uuid     := 'daaaaaaa-dddd-dddd-dddd-dddddddddddd';
BEGIN
  -- 1. Khởi tạo Danh mục Liên kết chung (Links Catalog)
  INSERT INTO public.links (id, default_label, target_url, kind, description)
  VALUES
    (v_link_shopee, 'Đặt món qua ShopeeFood', 'https://shopeefood.vn/thuong-hieu/go-cafe', 'http', 'Giao hàng tận nơi qua ShopeeFood'),
    (v_link_grab, 'Đặt món qua GrabFood', 'https://grab.onelink.me/2695613898?pid=gocafe', 'http', 'Ưu đãi đặt món trên GrabFood'),
    (v_link_menu, 'Xem thực đơn chi tiết (Menu)', 'https://gocafe.vn/menu.pdf', 'http', 'Menu đầy đủ các loại đồ uống Gờ Cafe'),
    (v_link_maps, 'Tìm cửa hàng gần nhất', 'https://maps.google.com/?q=Go+Cafe+Saigon', 'http', 'Hệ thống chi nhánh Gờ Cafe TP.HCM'),
    (v_link_tel, 'Hotline CSKH & Đặt hàng', 'tel:1900123456', 'tel', 'Tổng đài chăm sóc khách hàng'),
    (v_link_email, 'Gửi email phòng nhân sự', 'mailto:hr@gocafe.vn', 'mailto', 'Tiếp nhận CV và hồ sơ ứng tuyển'),
    (v_link_apply, 'Đăng ký ứng tuyển Barista', 'https://forms.gle/sampleGocafeBarista', 'http', 'Biểu mẫu ứng tuyển nhân sự'),
    (v_link_franchise, 'Tải hồ sơ nhượng quyền Gờ Cafe', 'https://gocafe.vn/franchise-brochure.pdf', 'http', 'Chính sách đầu tư và hợp tác nhượng quyền')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Trang 1: /gocafe (Trang thương hiệu chính)
  INSERT INTO public.pages (id, internal_name, status, lock_version)
  VALUES (v_page_brand, 'Trang chủ thương hiệu Gờ Cafe', 'published', 2)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES ('gocafe', v_page_brand, true)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.page_revisions (id, page_id, revision_no, state, lock_version, title, description, theme, sealed_at)
  VALUES (
    v_rev_brand,
    v_page_brand,
    1,
    'sealed',
    1,
    'Gờ Cafe - Cà phê đậm chất Sài Gòn',
    'Hệ thống cà phê mang đi & không gian trải nghiệm mộc mạc, gần gũi. Mở cửa từ 06:00 - 22:30 hàng ngày.',
    '{"preset": "go-original", "borderRadius": "md"}'::jsonb,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.pages
  SET published_revision_id = v_rev_brand
  WHERE id = v_page_brand AND published_revision_id IS NULL;

  INSERT INTO public.page_blocks (id, page_id, revision_id, type, position, payload)
  VALUES
    (v_block_brand_hdr, v_page_brand, v_rev_brand, 'header', 0, '{"title": "Gờ Cafe - Cà phê Sài Gòn", "bio": "Mộc mạc • Đậm vị • Thân quen"}'::jsonb),
    (v_block_brand_list, v_page_brand, v_rev_brand, 'link_list', 1, '{"title": "Liên kết tiện ích"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_links (id, page_id, link_id)
  VALUES
    (v_plk_brand_shopee, v_page_brand, v_link_shopee),
    (v_plk_brand_grab, v_page_brand, v_link_grab),
    (v_plk_brand_menu, v_page_brand, v_link_menu),
    (v_plk_brand_maps, v_page_brand, v_link_maps),
    (v_plk_brand_tel, v_page_brand, v_link_tel)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.revision_link_placements (page_id, revision_id, block_id, page_link_id, position, resolved_label)
  VALUES
    (v_page_brand, v_rev_brand, v_block_brand_list, v_plk_brand_shopee, 0, 'Đặt món qua ShopeeFood'),
    (v_page_brand, v_rev_brand, v_block_brand_list, v_plk_brand_grab, 1, 'Đặt món qua GrabFood'),
    (v_page_brand, v_rev_brand, v_block_brand_list, v_plk_brand_menu, 2, 'Xem thực đơn chi tiết (Menu)'),
    (v_page_brand, v_rev_brand, v_block_brand_list, v_plk_brand_maps, 3, 'Tìm cửa hàng gần nhất'),
    (v_page_brand, v_rev_brand, v_block_brand_list, v_plk_brand_tel, 4, 'Hotline CSKH & Đặt hàng')
  ON CONFLICT (revision_id, page_link_id) DO NOTHING;

  -- 3. Trang 2: /tuyendung (Trang Tuyển dụng & Đội ngũ)
  INSERT INTO public.pages (id, internal_name, status, lock_version)
  VALUES (v_page_careers, 'Trang tuyển dụng nhân sự', 'published', 2)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES ('tuyendung', v_page_careers, true)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.page_revisions (id, page_id, revision_no, state, lock_version, title, description, theme, sealed_at)
  VALUES (
    v_rev_careers,
    v_page_careers,
    1,
    'sealed',
    1,
    'Gia đình Gờ Cafe Tuyển Dụng',
    'Cơ hội nghề nghiệp dành cho các bạn trẻ đam mê ngành F&B, Barista và dịch vụ khách hàng chuyên nghiệp.',
    '{"preset": "coffee-morning", "borderRadius": "md"}'::jsonb,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.pages
  SET published_revision_id = v_rev_careers
  WHERE id = v_page_careers AND published_revision_id IS NULL;

  INSERT INTO public.page_blocks (id, page_id, revision_id, type, position, payload)
  VALUES
    (v_block_careers_hdr, v_page_careers, v_rev_careers, 'header', 0, '{"title": "Gờ Tuyển Dụng", "bio": "Gia nhập gia đình Gờ ngay hôm nay"}'::jsonb),
    (v_block_careers_list, v_page_careers, v_rev_careers, 'link_list', 1, '{"title": "Vị trí tuyển dụng"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_links (id, page_id, link_id)
  VALUES
    (v_plk_careers_apply, v_page_careers, v_link_apply),
    (v_plk_careers_email, v_page_careers, v_link_email),
    (v_plk_careers_menu, v_page_careers, v_link_menu)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.revision_link_placements (page_id, revision_id, block_id, page_link_id, position, resolved_label)
  VALUES
    (v_page_careers, v_rev_careers, v_block_careers_list, v_plk_careers_apply, 0, 'Đăng ký ứng tuyển Barista Part-time / Full-time'),
    (v_page_careers, v_rev_careers, v_block_careers_list, v_plk_careers_email, 1, 'Gửi hồ sơ qua Email HR'),
    (v_page_careers, v_rev_careers, v_block_careers_list, v_plk_careers_menu, 2, 'Tìm hiểu sản phẩm qua Menu')
  ON CONFLICT (revision_id, page_link_id) DO NOTHING;

  -- 4. Trang 3: /nhuongquyen (Trang Hợp tác & Nhượng quyền)
  INSERT INTO public.pages (id, internal_name, status, lock_version)
  VALUES (v_page_franchise, 'Trang hợp tác nhượng quyền', 'published', 2)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_slugs (slug, page_id, is_current)
  VALUES ('nhuongquyen', v_page_franchise, true)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.page_revisions (id, page_id, revision_no, state, lock_version, title, description, theme, sealed_at)
  VALUES (
    v_rev_franchise,
    v_page_franchise,
    1,
    'sealed',
    1,
    'Hợp tác Nhượng quyền Thương hiệu Gờ Cafe',
    'Mô hình kinh doanh cà phê tinh gọn, tối ưu chi phí đầu tư và khả năng thu hồi vốn nhanh.',
    '{"preset": "modern-clean", "borderRadius": "full"}'::jsonb,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.pages
  SET published_revision_id = v_rev_franchise
  WHERE id = v_page_franchise AND published_revision_id IS NULL;

  INSERT INTO public.page_blocks (id, page_id, revision_id, type, position, payload)
  VALUES
    (v_block_fran_hdr, v_page_franchise, v_rev_franchise, 'header', 0, '{"title": "Gờ Cafe Nhượng Quyền", "bio": "Đồng hành kinh doanh bền vững"}'::jsonb),
    (v_block_fran_list, v_page_franchise, v_rev_franchise, 'link_list', 1, '{"title": "Thông tin đối tác"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.page_links (id, page_id, link_id)
  VALUES
    (v_plk_fran_doc, v_page_franchise, v_link_franchise),
    (v_plk_fran_tel, v_page_franchise, v_link_tel)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.revision_link_placements (page_id, revision_id, block_id, page_link_id, position, resolved_label)
  VALUES
    (v_page_franchise, v_rev_franchise, v_block_fran_list, v_plk_fran_doc, 0, 'Tải hồ sơ nhượng quyền & Chính sách'),
    (v_page_franchise, v_rev_franchise, v_block_fran_list, v_plk_fran_tel, 1, 'Hotline tư vấn nhượng quyền 24/7')
  ON CONFLICT (revision_id, page_link_id) DO NOTHING;

END $$;

COMMIT;
