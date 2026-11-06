export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Tài nguyên không tồn tại", details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Yêu cầu đăng nhập để tiếp tục", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện thao tác này", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dữ liệu không hợp lệ", details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

