-- Migration 02: 10 Core Tables & Auxiliary Relationships

-- 1. media_assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL,
  object_path text NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('private', 'public')),
  status text NOT NULL CHECK (status IN ('pending', 'ready', 'failed', 'deleting')) DEFAULT 'pending',
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  original_filename text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT uq_media_assets_bucket_path UNIQUE (bucket_id, object_path)
);

-- 2. links
CREATE TABLE IF NOT EXISTS public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_label text NOT NULL CHECK (length(trim(default_label)) > 0),
  target_url text NOT NULL CHECK (length(trim(target_url)) > 0),
  kind text NOT NULL CHECK (kind IN ('http', 'tel', 'mailto')) DEFAULT 'http',
  description text,
  default_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  lock_version bigint NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

-- 3. pages (chưa gắn FK published_revision_id)
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name text NOT NULL CHECK (length(trim(internal_name)) > 0),
  status text NOT NULL CHECK (status IN ('unpublished', 'published', 'archived')) DEFAULT 'unpublished',
  published_revision_id uuid,
  lock_version bigint NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT chk_pages_status_archived CHECK (
    (status = 'archived' AND archived_at IS NOT NULL) OR
    (status <> 'archived' AND archived_at IS NULL)
  )
);

-- 4. page_slugs
CREATE TABLE IF NOT EXISTS public.page_slugs (
  slug text PRIMARY KEY CHECK (length(slug) <= 80 AND slug ~ '^[a-z0-9]+([.-][a-z0-9]+)*$'),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_page_slugs_current ON public.page_slugs(page_id) WHERE is_current;

-- 5. page_revisions
CREATE TABLE IF NOT EXISTS public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  state text NOT NULL CHECK (state IN ('draft', 'sealed')) DEFAULT 'draft',
  lock_version bigint NOT NULL DEFAULT 1,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(seo) = 'object'),
  theme jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(theme) = 'object'),
  schema_version integer NOT NULL DEFAULT 1,
  sealed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_page_revisions_no UNIQUE (page_id, revision_no),
  CONSTRAINT uq_page_revisions_composite UNIQUE (page_id, id),
  CONSTRAINT chk_page_revisions_sealed CHECK (
    (state = 'sealed' AND sealed_at IS NOT NULL) OR
    (state = 'draft' AND sealed_at IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_page_revisions_draft ON public.page_revisions(page_id) WHERE state = 'draft';

-- Bổ sung FK con trỏ công khai từ pages -> page_revisions(page_id, id)
ALTER TABLE public.pages
  ADD CONSTRAINT fk_pages_published_revision
  FOREIGN KEY (id, published_revision_id)
  REFERENCES public.page_revisions(page_id, id)
  ON DELETE RESTRICT;

-- 6. page_blocks
CREATE TABLE IF NOT EXISTS public.page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('header', 'image', 'heading', 'text', 'link_list', 'social_icons', 'spacer', 'divider')),
  position integer NOT NULL CHECK (position >= 0),
  is_visible boolean NOT NULL DEFAULT true,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_page_blocks_revision FOREIGN KEY (page_id, revision_id) REFERENCES public.page_revisions(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT uq_page_blocks_composite UNIQUE (page_id, revision_id, id),
  CONSTRAINT uq_page_blocks_position UNIQUE (revision_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- 7. page_links
CREATE TABLE IF NOT EXISTS public.page_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE RESTRICT,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT uq_page_links_composite UNIQUE (page_id, id),
  CONSTRAINT uq_page_links_composite_all UNIQUE (page_id, id, link_id)
);

-- 8. revision_link_placements
CREATE TABLE IF NOT EXISTS public.revision_link_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  block_id uuid NOT NULL,
  page_link_id uuid NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  label_override text,
  media_override_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  resolved_label text,
  resolved_media_id uuid REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_placements_block FOREIGN KEY (page_id, revision_id, block_id) REFERENCES public.page_blocks(page_id, revision_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_placements_page_link FOREIGN KEY (page_id, page_link_id) REFERENCES public.page_links(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT uq_placements_revision_link UNIQUE (revision_id, page_link_id),
  CONSTRAINT uq_placements_block_position UNIQUE (block_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- 9. revision_media_assets
CREATE TABLE IF NOT EXISTS public.revision_media_assets (
  revision_id uuid NOT NULL REFERENCES public.page_revisions(id) ON DELETE RESTRICT,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  PRIMARY KEY (revision_id, media_asset_id)
);

-- 10. click_events
CREATE TABLE IF NOT EXISTS public.click_events (
  id uuid PRIMARY KEY,
  page_id uuid NOT NULL,
  link_id uuid NOT NULL,
  page_link_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_click_events_revision FOREIGN KEY (page_id, revision_id) REFERENCES public.page_revisions(page_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_click_events_link FOREIGN KEY (page_id, page_link_id, link_id) REFERENCES public.page_links(page_id, id, link_id) ON DELETE RESTRICT
);

