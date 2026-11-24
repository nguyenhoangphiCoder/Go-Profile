import { z } from "zod";

export const roleSchema = z.enum(["owner", "editor", "viewer"]);
export const workspacePlanSchema = z.enum(["free", "pro", "enterprise"]);

export const workspaceFeaturesSchema = z.object({
  landing: z.boolean().default(true),
  branches: z.boolean().default(true),
  leads: z.boolean().default(true),
  tracking: z.boolean().default(true),
  customDomains: z.boolean().default(false),
});

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
  plan: workspacePlanSchema.optional(),
  features: workspaceFeaturesSchema.optional(),
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
  maxBranches: z.coerce
    .number()
    .int("Số chi nhánh phải là số nguyên")
    .min(0, "Tối thiểu 0 chi nhánh")
    .max(10000, "Tối đa 10.000 chi nhánh")
    .optional(),
  maxShells: z.coerce
    .number()
    .int("Số bộ giao diện phải là số nguyên")
    .min(1, "Tối thiểu 1 bộ giao diện")
    .max(200, "Tối đa 200 bộ giao diện")
    .optional(),
});

export const createWorkspaceSchema = workspaceLimitsSchema.extend({
  name: z.string().trim().min(1, "Vui lòng nhập tên workspace").max(80, "Tên tối đa 80 ký tự"),
  ownerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || z.email().safeParse(v).success, "Email chủ sở hữu không hợp lệ")
    .optional(),
});

export const renameWorkspaceSchema = z.object({
  workspaceId: z.uuid("ID workspace không hợp lệ"),
  name: z.string().trim().min(1, "Vui lòng nhập tên workspace").max(80, "Tên tối đa 80 ký tự"),
});

export const createPlatformUserSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
  displayName: z.string().trim().max(80, "Tên hiển thị tối đa 80 ký tự").optional(),
  isSuperAdmin: z.boolean().default(false),
  workspaceId: z.string().trim().optional(),
  role: roleSchema.default("owner"),
});

export const resetUserPasswordSchema = z.object({
  userId: z.uuid("ID tài khoản không hợp lệ"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

export const assignUserWorkspaceSchema = z.object({
  userId: z.uuid("ID tài khoản không hợp lệ"),
  workspaceId: z.uuid("ID workspace không hợp lệ"),
  role: roleSchema,
});

export const mbToBytes = (mb: number) => mb * MB;
export const bytesToMb = (bytes: number) => Math.round(bytes / MB);

export type InviteMemberInput = z.input<typeof inviteMemberSchema>;
export type CreateWorkspaceInput = z.input<typeof createWorkspaceSchema>;
export type WorkspaceLimitsInput = z.input<typeof workspaceLimitsSchema>;
export type CreatePlatformUserInput = z.input<typeof createPlatformUserSchema>;
export type ResetUserPasswordInput = z.input<typeof resetUserPasswordSchema>;
export type AssignUserWorkspaceInput = z.input<typeof assignUserWorkspaceSchema>;
