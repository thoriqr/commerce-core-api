import { TransactionManager } from "@/infra/db/transaction-manager";
import { UserRepo } from "./user.repo";

export class UserService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: UserRepo
  ) {}
}
