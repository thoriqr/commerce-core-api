import { UserRole } from "@/shared/user/user.types";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  hasPassword: boolean;
};

export type LoginResponse = {
  user: AuthUser;
};

export type AuthContext = {
  id: string;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string; // user id
  role: UserRole;
};
