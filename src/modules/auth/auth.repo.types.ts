import { UserRole, UserStatus } from "@/shared/user/user.types";

export type UserDetailRow = {
  id: number;
  email: string;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  display_name: string | null;
  is_demo: boolean;
};

export type VerificationType = "REGISTER" | "RESET_PASSWORD" | "INVITE" | "CHANGE_EMAIL";

export type RefreshTokenRow = {
  id: number;
  user_id: number;
  session_id: number;
  expires_at: Date;
  revoked_at: Date | null;
  session_revoked_at: Date | null;
};
