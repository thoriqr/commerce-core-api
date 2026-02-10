import { Knex } from "knex";
import { CollectionReorderSchema, CollectionUpsertSchema } from "./collection.schema";
import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { CollectionDetailRow, CollectionRow } from "./collection.types";
import { mapCollectionDetail, mapCollectionList, mapCollectionOptions } from "./collection.mapper";
import { BANNER_TARGET_TYPE } from "../marketing/banner.constants";

export class CollectionRepo {
  async getAll() {
    const { rows } = await db.raw<{
      rows: (CollectionRow & { product_count: number })[];
    }>(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.sort_order,
        c.status,
        COUNT(pc.product_id) AS product_count
      FROM collections c
      LEFT JOIN product_collections pc
        ON pc.collection_id = c.id
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.sort_order,
        c.status
      ORDER BY
        c.sort_order ASC,
        c.id ASC
    `);

    return mapCollectionList(rows);
  }

  async getById(collectionId: number) {
    const { rows } = await db.raw<{ rows: CollectionDetailRow[] }>(
      `
      SELECT id, name, slug, description, sort_order, status
      FROM collections
      WHERE id = :collectionId  
    `,
      { collectionId }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Collection not found");
    }

    return mapCollectionDetail(row);
  }

  async create(trx: Knex.Transaction, input: CollectionUpsertSchema, slug: string) {
    const sortOrder = await this.getNextSortOrder(trx);

    const { name, description, status } = input;

    await trx.raw(
      `
      INSERT INTO collections
        (name, slug, description, status, sort_order)
      VALUES
        (:name, :slug, :description, :status, :sortOrder)
    `,
      {
        name,
        slug,
        description: description ?? null,
        status,
        sortOrder
      }
    );
  }

  async update(trx: Knex.Transaction, collectionId: number, input: CollectionUpsertSchema, slug: string) {
    const { name, description, status } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
          UPDATE collections
            SET name = :name, description = :description, slug = :slug, status = :status
          WHERE id = :collectionId
          RETURNING id
        `,
      { name, description: description ?? null, slug, status, collectionId }
    );

    if (!rows.length) {
      throw AppError.notFound("Collection not found");
    }
  }

  async remove(collectionId: number) {
    const { rows: bannerRows } = await db.raw<{ rows: { id: number }[] }>(
      `
      SELECT 1
      FROM marketing_banners
      WHERE target_type = :targetType
        AND target_id = :collectionId
      LIMIT 1
      `,
      { targetType: BANNER_TARGET_TYPE.COLLECTION, collectionId }
    );

    if (bannerRows.length > 0) {
      throw AppError.badRequest("Collection is still used by a banner");
    }

    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
          DELETE FROM collections
          WHERE id = :collectionId
          RETURNING id  
        `,
      { collectionId }
    );

    if (!rows.length) {
      throw AppError.notFound("Collection not found");
    }
  }

  async getOptions() {
    const { rows } = await db.raw<{
      rows: { id: number; name: string }[];
    }>(`
    SELECT id, name
    FROM collections
    ORDER BY sort_order ASC, id ASC
  `);

    return mapCollectionOptions(rows);
  }

  async reorderCollection(trx: Knex.Transaction, input: CollectionReorderSchema) {
    const ids = input.map((i) => i.id);

    const cases = input.map((i) => `WHEN ${i.id} THEN ${i.sortOrder}`).join(" ");

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE collections
        SET sort_order = CASE id
        ${cases}
      END
      WHERE id = ANY(:ids)
      RETURNING id
      `,
      { ids }
    );

    if (!rows.length) {
      throw AppError.notFound("Collection not found or invalid collection");
    }
  }

  async findBaseId(id: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{ rows: { id: number }[] }>(
      `
      SELECT id FROM collections
      WHERE id = :id
    `,
      { id }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Collection not found");
    }

    return row;
  }

  private async getNextSortOrder(trx: Knex.Transaction): Promise<number> {
    const { rows } = await trx.raw<{ rows: { max: number | null }[] }>(
      `
        SELECT MAX(sort_order) AS max
        FROM collections
      `
    );

    // kalau belum ada sibling → rows[0].max = null
    return (rows[0]?.max ?? -1) + 1;
  }
}
