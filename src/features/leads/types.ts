export type LeadStatus = "new" | "contacted" | "converted" | "spam";

export interface LeadItem {
  id: string;
  pageId: string | null;
  pageName: string | null;
  pageSlug: string | null;
  formName: string;
  fullName: string;
  phone: string;
  email: string | null;
  note: string | null;
  status: LeadStatus;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
  updatedAt: string;
}
