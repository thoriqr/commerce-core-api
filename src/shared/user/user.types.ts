export type UserRole = "USER" | "ADMIN" | "SUPER";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type Provider = "GOOGLE" | "GITHUB";

export type UserProvider = {
  provider: Provider;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};
