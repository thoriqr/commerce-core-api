import { AuthContext } from "@/modules/auth/auth.types";
import { AppClient } from "./app-client";

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
      client?: AppClient;
    }
  }
}
