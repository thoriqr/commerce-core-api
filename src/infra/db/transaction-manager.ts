import { Knex } from "knex";

export interface TransactionManager {
  transaction<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T>;
}

export class KnexTransactionManager implements TransactionManager {
  constructor(private knex: Knex) {}

  transaction<T>(fn: (trx: Knex.Transaction) => Promise<T>) {
    return this.knex.transaction(fn);
  }
}
