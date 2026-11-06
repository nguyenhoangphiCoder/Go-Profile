import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email")
    .email("Địa chỉ email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
  redirectTo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
