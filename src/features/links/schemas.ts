import { z } from "zod";

export const linkSchema = z
  .object({
    id: z.string().uuid().optional(),
    defaultLabel: z
      .string()
      .trim()
      .min(1, "Nhãn liên kết không được để trống")
      .max(100, "Nhãn liên kết tối đa 100 ký tự"),
    kind: z.enum(["http", "tel", "mailto"], {
      message: "Loại liên kết phải là http, tel hoặc mailto",
    }),
    targetUrl: z.string().trim().min(1, "Địa chỉ liên kết đích không được để trống"),
    description: z.string().trim().max(255, "Mô tả tối đa 255 ký tự").optional().nullable(),
    defaultMediaId: z.string().uuid().optional().nullable(),
    lockVersion: z.coerce.number().optional().default(1),
  })
  .superRefine((data, ctx) => {
    const url = data.targetUrl.toLowerCase();

    // Chặn các giao thức nguy hiểm (XSS injection)
    if (url.startsWith("javascript:") || url.startsWith("data:") || url.startsWith("vbscript:")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetUrl"],
        message: "Giao thức liên kết không an toàn và bị nghiêm cấm",
      });
      return;
    }

    if (data.kind === "http") {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetUrl"],
          message: "Liên kết web phải bắt đầu bằng http:// hoặc https://",
        });
      }
    } else if (data.kind === "tel") {
      if (!url.startsWith("tel:")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetUrl"],
          message:
            "Số điện thoại phải bắt đầu bằng tel: (ví dụ: tel:1900123456 hoặc tel:0901234567)",
        });
      }
    } else if (data.kind === "mailto") {
      if (!url.startsWith("mailto:")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetUrl"],
          message: "Email phải bắt đầu bằng mailto: (ví dụ: mailto:cskh@gocafe.vn)",
        });
      } else {
        const emailPart = data.targetUrl.slice(7).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailPart)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetUrl"],
            message: "Địa chỉ email sau mailto: không đúng định dạng",
          });
        }
      }
    }
  });

export type LinkInput = z.infer<typeof linkSchema>;
