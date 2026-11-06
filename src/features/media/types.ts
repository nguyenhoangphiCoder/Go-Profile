export interface MediaAssetItem {
  id: string;
  bucketId: string;
  objectPath: string;
  visibility: "public" | "private";
  status: "pending" | "ready" | "failed" | "deleting";
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  originalFilename: string | null;
  publicUrl: string;
  isReferenced: boolean;
  createdAt: string;
}

export interface MediaUploadState {
  success?: boolean;
  error?: string;
  asset?: MediaAssetItem;
}
