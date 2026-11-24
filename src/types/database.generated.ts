export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          display_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reserved_slugs: {
        Row: {
          slug: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          slug: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          slug?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          bucket_id: string;
          object_path: string;
          visibility: "private" | "public";
          status: "pending" | "ready" | "failed" | "deleting";
          mime_type: string | null;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          original_filename: string | null;
          created_by: string | null;
          created_at: string;
          archived_at: string | null;
          workspace_id: string;
        };
        Insert: {
          id?: string;
          bucket_id: string;
          object_path: string;
          visibility: "private" | "public";
          status?: "pending" | "ready" | "failed" | "deleting";
          mime_type?: string | null;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          original_filename?: string | null;
          created_by?: string | null;
          created_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          object_path?: string;
          visibility?: "private" | "public";
          status?: "pending" | "ready" | "failed" | "deleting";
          mime_type?: string | null;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          original_filename?: string | null;
          created_by?: string | null;
          created_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          default_label: string;
          target_url: string;
          kind: "standard" | "contact" | "social" | "http" | "tel" | "mailto";
          description: string | null;
          default_media_id: string | null;
          is_active: boolean;
          lock_version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          workspace_id: string;
        };
        Insert: {
          id?: string;
          default_label: string;
          target_url: string;
          kind?: "standard" | "contact" | "social" | "http" | "tel" | "mailto";
          description?: string | null;
          default_media_id?: string | null;
          is_active?: boolean;
          lock_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Update: {
          id?: string;
          default_label?: string;
          target_url?: string;
          kind?: "standard" | "contact" | "social" | "http" | "tel" | "mailto";
          description?: string | null;
          default_media_id?: string | null;
          is_active?: boolean;
          lock_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_default_media_id_fkey";
            columns: ["default_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          id: string;
          internal_name: string;
          status: "unpublished" | "published" | "archived";
          published_revision_id: string | null;
          lock_version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          workspace_id: string;
          page_kind: "profile" | "landing";
          site_shell_id: string | null;
        };
        Insert: {
          id?: string;
          internal_name: string;
          status?: "unpublished" | "published" | "archived";
          published_revision_id?: string | null;
          lock_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
          page_kind?: "profile" | "landing";
          site_shell_id?: string | null;
        };
        Update: {
          id?: string;
          internal_name?: string;
          status?: "unpublished" | "published" | "archived";
          published_revision_id?: string | null;
          lock_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
          page_kind?: "profile" | "landing";
          site_shell_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_pages_published_revision";
            columns: ["id", "published_revision_id"];
            isOneToOne: false;
            referencedRelation: "page_revisions";
            referencedColumns: ["page_id", "id"];
          },
        ];
      };
      page_slugs: {
        Row: {
          slug: string;
          page_id: string;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          slug: string;
          page_id: string;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          slug?: string;
          page_id?: string;
          is_current?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_slugs_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_revisions: {
        Row: {
          id: string;
          page_id: string;
          revision_no: number;
          state: "draft" | "sealed";
          lock_version: number;
          title: string;
          description: string | null;
          seo: Json;
          theme: Json;
          schema_version: number;
          sealed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          revision_no: number;
          state?: "draft" | "sealed";
          lock_version?: number;
          title: string;
          description?: string | null;
          seo?: Json;
          theme?: Json;
          schema_version?: number;
          sealed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          revision_no?: number;
          state?: "draft" | "sealed";
          lock_version?: number;
          title?: string;
          description?: string | null;
          seo?: Json;
          theme?: Json;
          schema_version?: number;
          sealed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_revisions_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_blocks: {
        Row: {
          id: string;
          page_id: string;
          revision_id: string;
          type:
            | "header"
            | "image"
            | "heading"
            | "text"
            | "link_list"
            | "social_icons"
            | "spacer"
            | "divider"
            | "button"
            | "gallery"
            | "menu_card"
            | "accordion"
            | "video_embed"
            | "map"
            | "hero_section"
            | "toc_bar"
            | "stats_strip"
            | "split_content"
            | "info_cards"
            | "pricing_table"
            | "product_grid"
            | "store_locator"
            | "lead_form"
            | "banner_slider"
            | "testimonials"
            | "cta_banner";
          position: number;
          is_visible: boolean;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          revision_id: string;
          type:
            | "header"
            | "image"
            | "heading"
            | "text"
            | "link_list"
            | "social_icons"
            | "spacer"
            | "divider"
            | "button"
            | "gallery"
            | "menu_card"
            | "accordion"
            | "video_embed"
            | "map"
            | "hero_section"
            | "toc_bar"
            | "stats_strip"
            | "split_content"
            | "info_cards"
            | "pricing_table"
            | "product_grid"
            | "store_locator"
            | "lead_form"
            | "banner_slider"
            | "testimonials"
            | "cta_banner";
          position: number;
          is_visible?: boolean;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          revision_id?: string;
          type?:
            | "header"
            | "image"
            | "heading"
            | "text"
            | "link_list"
            | "social_icons"
            | "spacer"
            | "divider"
            | "button"
            | "gallery"
            | "menu_card"
            | "accordion"
            | "video_embed"
            | "map"
            | "hero_section"
            | "toc_bar"
            | "stats_strip"
            | "split_content"
            | "info_cards"
            | "pricing_table"
            | "product_grid"
            | "store_locator"
            | "lead_form"
            | "banner_slider"
            | "testimonials"
            | "cta_banner";
          position?: number;
          is_visible?: boolean;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_page_blocks_revision";
            columns: ["page_id", "revision_id"];
            isOneToOne: false;
            referencedRelation: "page_revisions";
            referencedColumns: ["page_id", "id"];
          },
        ];
      };
      page_links: {
        Row: {
          id: string;
          page_id: string;
          link_id: string;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          link_id: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          link_id?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "page_links_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_links_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_link_placements: {
        Row: {
          id: string;
          page_id: string;
          revision_id: string;
          block_id: string;
          page_link_id: string;
          position: number;
          label_override: string | null;
          media_override_id: string | null;
          resolved_label: string | null;
          resolved_media_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          revision_id: string;
          block_id: string;
          page_link_id: string;
          position: number;
          label_override?: string | null;
          media_override_id?: string | null;
          resolved_label?: string | null;
          resolved_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          revision_id?: string;
          block_id?: string;
          page_link_id?: string;
          position?: number;
          label_override?: string | null;
          media_override_id?: string | null;
          resolved_label?: string | null;
          resolved_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_placements_block";
            columns: ["page_id", "revision_id", "block_id"];
            isOneToOne: false;
            referencedRelation: "page_blocks";
            referencedColumns: ["page_id", "revision_id", "id"];
          },
          {
            foreignKeyName: "fk_placements_page_link";
            columns: ["page_id", "page_link_id"];
            isOneToOne: false;
            referencedRelation: "page_links";
            referencedColumns: ["page_id", "id"];
          },
        ];
      };
      revision_media_assets: {
        Row: {
          revision_id: string;
          media_asset_id: string;
        };
        Insert: {
          revision_id: string;
          media_asset_id: string;
        };
        Update: {
          revision_id?: string;
          media_asset_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_media_assets_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "page_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revision_media_assets_media_asset_id_fkey";
            columns: ["media_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      site_shells: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          is_default: boolean;
          site_name: string | null;
          logo_media_id: string | null;
          header_config: Json;
          footer_columns: Json;
          floating_contact: Json;
          default_theme: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          is_default?: boolean;
          site_name?: string | null;
          logo_media_id?: string | null;
          header_config?: Json;
          footer_columns?: Json;
          floating_contact?: Json;
          default_theme?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          is_default?: boolean;
          site_name?: string | null;
          logo_media_id?: string | null;
          header_config?: Json;
          footer_columns?: Json;
          floating_contact?: Json;
          default_theme?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_shells_logo_media_id_fkey";
            columns: ["logo_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_shells_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_site_settings: {
        Row: {
          workspace_id: string;
          site_name: string | null;
          logo_media_id: string | null;
          header_config: Json;
          footer_columns: Json;
          floating_contact: Json;
          default_theme: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          site_name?: string | null;
          logo_media_id?: string | null;
          header_config?: Json;
          footer_columns?: Json;
          floating_contact?: Json;
          default_theme?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          site_name?: string | null;
          logo_media_id?: string | null;
          header_config?: Json;
          footer_columns?: Json;
          floating_contact?: Json;
          default_theme?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_site_settings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_site_settings_logo_media_id_fkey";
            columns: ["logo_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      site_nav_items: {
        Row: {
          id: string;
          workspace_id: string;
          shell_id: string | null;
          parent_id: string | null;
          label: string;
          target_type: "page" | "anchor" | "url";
          target_page_id: string | null;
          target_value: string | null;
          position: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shell_id?: string | null;
          parent_id?: string | null;
          label: string;
          target_type: "page" | "anchor" | "url";
          target_page_id?: string | null;
          target_value?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          shell_id?: string | null;
          parent_id?: string | null;
          label?: string;
          target_type?: "page" | "anchor" | "url";
          target_page_id?: string | null;
          target_value?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_nav_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_nav_items_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "site_nav_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_nav_items_target_page_id_fkey";
            columns: ["target_page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          id: string;
          workspace_id: string;
          code: string | null;
          name: string;
          address: string;
          district: string;
          city: string;
          phone: string | null;
          hours: string | null;
          lat: number | null;
          lng: number | null;
          maps_url: string | null;
          position: number;
          is_active: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          code?: string | null;
          name: string;
          address: string;
          district?: string;
          city?: string;
          phone?: string | null;
          hours?: string | null;
          lat?: number | null;
          lng?: number | null;
          maps_url?: string | null;
          position?: number;
          is_active?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          code?: string | null;
          name?: string;
          address?: string;
          district?: string;
          city?: string;
          phone?: string | null;
          hours?: string | null;
          lat?: number | null;
          lng?: number | null;
          maps_url?: string | null;
          position?: number;
          is_active?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          page_id: string | null;
          form_name: string;
          full_name: string;
          phone: string;
          email: string | null;
          note: string | null;
          status: "new" | "contacted" | "converted" | "spam";
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          ip_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          page_id?: string | null;
          form_name: string;
          full_name: string;
          phone: string;
          email?: string | null;
          note?: string | null;
          status?: "new" | "contacted" | "converted" | "spam";
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          page_id?: string | null;
          form_name?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          note?: string | null;
          status?: "new" | "contacted" | "converted" | "spam";
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      click_events: {
        Row: {
          id: string;
          page_id: string;
          link_id: string;
          page_link_id: string;
          revision_id: string;
          occurred_at: string;
        };
        Insert: {
          id: string;
          page_id: string;
          link_id: string;
          page_link_id: string;
          revision_id: string;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          link_id?: string;
          page_link_id?: string;
          revision_id?: string;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_click_events_revision";
            columns: ["page_id", "revision_id"];
            isOneToOne: false;
            referencedRelation: "page_revisions";
            referencedColumns: ["page_id", "id"];
          },
          {
            foreignKeyName: "fk_click_events_link";
            columns: ["page_id", "page_link_id", "link_id"];
            isOneToOne: false;
            referencedRelation: "page_links";
            referencedColumns: ["page_id", "id", "link_id"];
          },
        ];
      };
      theme_presets: {
        Row: {
          id: string;
          name: string;
          config: Json;
          schema_version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          workspace_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          config: Json;
          schema_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          config?: Json;
          schema_version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          plan: "free" | "pro" | "enterprise";
          features: Json;
          max_pages: number;
          max_media_bytes: number;
          max_branches: number;
          max_shells: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: "free" | "pro" | "enterprise";
          features?: Json;
          max_pages?: number;
          max_media_bytes?: number;
          max_branches?: number;
          max_shells?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: "free" | "pro" | "enterprise";
          features?: Json;
          max_pages?: number;
          max_media_bytes?: number;
          max_branches?: number;
          max_shells?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      workspace_domains: {
        Row: {
          id: string;
          workspace_id: string;
          domain: string;
          home_page_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          domain: string;
          home_page_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          domain?: string;
          home_page_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_domains_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_domains_home_page_id_fkey";
            columns: ["home_page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_email: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "editor" | "viewer";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: "owner" | "editor" | "viewer";
          invited_by: string | null;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: "owner" | "editor" | "viewer";
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: "owner" | "editor" | "viewer";
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_page: {
        Args: {
          p_slug: string;
        };
        Returns: Json;
      };
      get_public_branches: {
        Args: {
          p_workspace_id: string;
        };
        Returns: Json;
      };
      resolve_public_link: {
        Args: {
          p_page_link_id: string;
        };
        Returns: Json;
      };
      record_click: {
        Args: {
          p_event_id: string;
          p_page_link_id: string;
          p_expected_revision_id: string;
        };
        Returns: Json;
      };
      create_page:
        | {
            Args: {
              p_internal_name: string;
              p_slug: string;
              p_title: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_workspace_id: string;
              p_internal_name: string;
              p_slug: string;
              p_title: string;
              p_page_kind?: "profile" | "landing";
            };
            Returns: Json;
          };
      publish_page: {
        Args: {
          p_page_id: string;
          p_draft_id: string;
          p_expected_page_version: number;
          p_expected_draft_version: number;
        };
        Returns: Json;
      };
      accept_workspace_invitations: {
        Args: Record<string, never>;
        Returns: number;
      };
      sync_revision_media_assets: {
        Args: {
          p_revision_id: string;
        };
        Returns: number;
      };
      unpublish_page: {
        Args: {
          p_page_id: string;
          p_expected_page_version: number;
        };
        Returns: Json;
      };
      rename_page_slug: {
        Args: {
          p_page_id: string;
          p_new_slug: string;
          p_expected_page_version: number;
        };
        Returns: Json;
      };
      get_click_report: {
        Args: {
          p_from: string;
          p_to: string;
          p_page_id?: string;
          p_link_id?: string;
          p_timezone?: string;
          p_workspace_id?: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
};
