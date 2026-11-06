export type LinkKind = "http" | "tel" | "mailto";

export interface LinkItem {
  id: string;
  defaultLabel: string;
  targetUrl: string;
  kind: LinkKind;
  description: string | null;
  defaultMediaId: string | null;
  isActive: boolean;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  usageCount: number; // Số lượng trang đang sử dụng liên kết này
  affectedPages?: { id: string; internalName: string; slug?: string }[];
}

export interface LinkActionState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    defaultLabel?: string[];
    targetUrl?: string[];
    kind?: string[];
    description?: string[];
  };
}
