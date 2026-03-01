import { UserRole, UserStatus } from "@/shared/user/user.types";

export type UserRow = {
  id: number;
  email: string;
  role: UserRole;
  display_name: string | null;
  status: UserStatus;
};

export type UserDetailRow = {
  id: number;
  email: string;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  display_name: string | null;
};

export type VerificationType = "REGISTER" | "RESET_PASSWORD" | "INVITE" | "CHANGE_EMAIL";
