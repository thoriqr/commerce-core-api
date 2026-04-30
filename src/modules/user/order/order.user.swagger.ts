import { ROUTES } from "@/constants/routes";
import { USER_ROUTES } from "../user.constants";

const ORDER_BASE = `${ROUTES.USER}${USER_ROUTES.ORDERS}`;

export const userOrderSwagger = {
  tags: [
    {
      name: "User Orders",
      description: "User order history and details"
    }
  ],
  paths: {}
};
