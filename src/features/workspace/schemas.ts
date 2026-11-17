import { z } from "zod";

export const roleSchema = z.enum(["owner", "editor", "viewer"]);

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email không hợp lệ").max(254, "Email quá dài"));

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});

export const updateMemberRoleSchema = z.object({
  userId: z.uuid("ID thành viên không hợp lệ"),
  role: roleSchema,
});

const MB = 1024 * 1024;

export const workspaceLimitsSchema = z.object({
  maxPages: z.coerce
    .number()
    .int("Số trang phải là số nguyên")
    .min(1, "Tối thiểu 1 trang")
    .max(10000, "Tối đa 10.000 trang"),
  maxMediaMb: z.coerce
    .number()
    .int("Dung lượng phải là số nguyên (MB)")
    .min(10, "Tối thiểu 10 MB")
    .max(100 * 1024, "Tối đa 100 GB"),
});

export const createWorkspaceSchema = workspaceLimitsSchema.extend({
  name: z.string().trim().min(1, "Vui lòng nhập tên workspace").max(80, "Tên tối đa 80 ký tự"),
  ownerEmail: emailSchema,
});

export const mbToBytes = (mb: number) => mb * MB;
export const bytesToMb = (bytes: number) => Math.round(bytes / MB);

export type InviteMemberInput = z.input<typeof inviteMemberSchema>;
export type CreateWorkspaceInput = z.input<typeof createWorkspaceSchema>;
export type WorkspaceLimitsInput = z.input<typeof workspaceLimitsSchema>;
