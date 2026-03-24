import { UserRole } from "@/shared/user/user.types";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  displayName: string | null;
};

export type LoginResponse = {
  user: AuthUser;
};

export type AuthContext = {
  id: number;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string; // user id
  role: UserRole;
};
