export interface BranchItem {
  id: string;
  code: string | null;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  position: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PublicBranchItem {
  id: string;
  code?: string | null;
  name: string;
  address: string;
  district: string;
  city: string;
  phone?: string | null;
  hours?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  position: number;
}

export interface ParsedBranchCsvRow {
  lineNumber: number;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  hours: string;
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
  code: string;
  error?: string;
}
