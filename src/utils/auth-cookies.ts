import { AppClient } from "@/types/app-client";

export function getCookieNames(client: AppClient) {
  return client === "admin"
    ? {
        access: "admin_access_token",
        refresh: "admin_refresh_token"
      }
    : {
        access: "access_token",
        refresh: "refresh_token"
      };
}
