import { UserRole } from "@/shared/user/user.types";
import { VerificationType } from "./auth.repo.types";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  displayName: string | null;
  isDemo: boolean;
};

export type LoginResponse = {
  user: AuthUser;
};

export type AuthContext = {
  id: number;
  role: UserRole;
  isDemo: boolean;
};

export type AccessTokenPayload = {
  sub: string; // user id
  role: UserRole;
  isDemo: boolean;
};

export type PendingVerificationRow = { id: number; expires_at: Date; used_at: Date | null; user_id: number; email: string; type: VerificationType };

export type AuthClient = "admin" | "store";
