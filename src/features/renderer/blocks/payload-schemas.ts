import { z } from "zod";
import type { BlockType } from "@/features/pages/types";

/**
 * Schema payload cho từng loại khối (không phụ thuộc UI, dùng được trong server action).
 * Kiểm tra kiểu và độ dài để chặn dữ liệu rác/quá lớn, nhưng vẫn cho phép trường phụ và
 * giá trị cũ (looseObject) để không làm hỏng các trang đã lưu trước đây.
 */
const optText = (max: number) => z.string().max(max).nullish();
const optUrl = z.string().max(2048).nullish();
const optId = z.string().max(64).nullish();
const optToken = z.string().max(32).nullish();

export const BLOCK_PAYLOAD_SCHEMAS: Record<BlockType, z.ZodType<Record<string, unknown>>> = {
  header: z.looseObject({
    title: optText(200),
    bio: optText(5000),
    avatarMediaId: optId,
    avatarUrl: optUrl,
    bannerMediaId: optId,
    bannerUrl: optUrl,
  }),
  image: z.looseObject({
    mediaAssetId: optId,
    imageUrl: optUrl,
    url: optUrl,
    alt: optText(300),
    caption: optText(500),
    targetUrl: optUrl,
  }),
  heading: z.looseObject({
    text: optText(300),
    level: z.union([z.number().int().min(1).max(6), z.string().max(2)]).nullish(),
  }),
  text: z.looseObject({
    content: optText(10000),
    align: optToken,
  }),
  link_list: z.looseObject({ layout: optToken }),
  social_icons: z.looseObject({ style: optToken }),
  spacer: z.looseObject({
    height: z.union([z.number().min(0).max(2000), z.string().max(16)]).nullish(),
  }),
  divider: z.looseObject({ style: optToken }),
};

export const BLOCK_TYPES = Object.keys(BLOCK_PAYLOAD_SCHEMAS) as [BlockType, ...BlockType[]];

/** Giới hạn kích thước payload sau khi serialize (chặn payload phình to). */
export const MAX_BLOCK_PAYLOAD_BYTES = 32 * 1024;
