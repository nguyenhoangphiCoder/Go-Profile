export interface AdminUser {
  userId: string;
  email: string | null;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}
