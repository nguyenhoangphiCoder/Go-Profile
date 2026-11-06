import { describe, it, expect } from "vitest";
import { loginSchema } from "@/features/auth/schemas";

describe("Auth Module: Schemas & Validation", () => {
  it("valid login credentials pass validation", () => {
    const valid = {
      email: "admin@gocafe.vn",
      password: "securepassword123",
      redirectTo: "/admin",
    };

    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("admin@gocafe.vn");
      expect(result.data.password).toBe("securepassword123");
    }
  });

  it("invalid email is rejected with Vietnamese error message", () => {
    const invalidEmail = {
      email: "not-an-email",
      password: "securepassword123",
    };

    const result = loginSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
      expect(result.error.flatten().fieldErrors.email?.[0]).toContain("không đúng định dạng");
    }
  });

  it("short password (< 6 chars) is rejected", () => {
    const shortPassword = {
      email: "admin@gocafe.vn",
      password: "123",
    };

    const result = loginSchema.safeParse(shortPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
      expect(result.error.flatten().fieldErrors.password?.[0]).toContain("tối thiểu 6 ký tự");
    }
  });

  it("missing required fields fail validation", () => {
    const empty = {
      email: "",
      password: "",
    };

    const result = loginSchema.safeParse(empty);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });
});
