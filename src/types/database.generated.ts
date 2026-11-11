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
            | "divider";
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
            | "divider";
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
            | "divider";
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
    };
    Views: Record<string, never>;
    Functions: {
      get_public_page: {
        Args: {
          p_slug: string;
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
      create_page: {
        Args: {
          p_internal_name: string;
          p_slug: string;
          p_title: string;
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
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
};
