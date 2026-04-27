import { UserRole } from "@/shared/user/user.types";
import { VerificationType } from "./auth.repo.types";
import { AuthUserSchema } from "./auth.schema";

export type AuthUser = AuthUserSchema;

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

export type PendingVerificationRow = {
  id: number;
  expires_at: string;
  used_at: string | null;
  user_id: number;
  email: string;
  type: VerificationType;
};

export type AuthClient = "admin" | "store";
