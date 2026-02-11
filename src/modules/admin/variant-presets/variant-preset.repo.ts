import { Knex } from "knex";
import { PresetDimensionUpsertSchema, PresetDimensionValueReorderSchema, PresetDimensionValueSchema } from "./variant-preset.schema";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";
import { db } from "@/infra/db/knex";
import {
  VariantPresetDetailRow,
  VariantPresetDimensionOptionRow,
  VariantPresetDimensionValueRow,
  VariantPresetListRow
} from "./variant-preset.types";
import { mapVariantPresetDetail, mapVariantPresetList } from "./variant-preset.mapper";

export class VariantPresetRepo {
  async getAll() {
    const { rows } = await db.raw<{ rows: VariantPresetListRow[] }>(`
      SELECT
        d.id,
        d.name,
        COUNT(v.id)::int AS values_count
      FROM variant_dimensions_presets d
      LEFT JOIN variant_dimension_values_presets v
        ON v.dimension_preset_id = d.id
      GROUP BY d.id
      ORDER BY d.created_at ASC  
    `);

    return mapVariantPresetList(rows);
  }

  async getById(dimensionPresetId: number) {
    const { rows } = await db.raw<{ rows: VariantPresetDetailRow[] }>(
      `
    SELECT
      d.id,
      d.name,
      v.id AS value_id,
      v.name AS value_name,
      v.hex_color,
      v.sort_order
    FROM variant_dimensions_presets d
    LEFT JOIN variant_dimension_values_presets v
      ON v.dimension_preset_id = d.id
    WHERE d.id = :dimensionPresetId
    ORDER BY v.sort_order ASC  
    `,
      { dimensionPresetId }
    );

    if (!rows.length) {
      throw AppError.notFound("Variant dimension preset not found");
    }

    return mapVariantPresetDetail(rows);
  }

  async create(trx: Knex.Transaction, input: PresetDimensionUpsertSchema) {
    const { name, values } = input;
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      INSERT INTO variant_dimensions_presets (name)
      VALUES (:name) RETURNING id
    `,
      { name }
    );

    const row = rows[0];
    if (!row) {
      logger.error("Insert variant_dimension_presets returned no rows");
      throw AppError.internal();
    }

    await this.insertDimensionValues(trx, row.id, values);
  }

  async update(trx: Knex.Transaction, dimensionPresetId: number, input: PresetDimensionUpsertSchema) {
    const { name, values } = input;

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
      UPDATE variant_dimensions_presets SET name = :name
      WHERE id = :dimensionPresetId
      RETURNING id
    `,
      { dimensionPresetId, name }
    );

    if (!rows.length) {
      throw AppError.notFound("Variant dimension preset not found");
    }

    await trx.raw(
      `
      DELETE FROM variant_dimension_values_presets
      WHERE dimension_preset_id = :dimensionPresetId
    `,
      { dimensionPresetId }
    );

    await this.insertDimensionValues(trx, dimensionPresetId, values);
  }

  async remove(dimensionPresetId: number) {
    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
        DELETE FROM variant_dimensions_presets
        WHERE id = :dimensionPresetId
        RETURNING id  
      `,
      { dimensionPresetId }
    );

    if (!rows.length) {
      throw AppError.notFound("Variant dimension preset not found");
    }
  }

  async getDimensionOptions() {
    const { rows } = await db.raw<{
      rows: VariantPresetDimensionOptionRow[];
    }>(`
    SELECT id, name
    FROM variant_dimensions_presets
    ORDER BY name ASC
  `);

    return rows;
  }

  async getValuesByDimensionName(name: string) {
    const { rows } = await db.raw<{
      rows: VariantPresetDimensionValueRow[];
    }>(
      `
    SELECT
      v.id,
      v.name,
      v.hex_color
    FROM variant_dimensions_presets d
    JOIN variant_dimension_values_presets v
      ON v.dimension_preset_id = d.id
    WHERE LOWER(d.name) = LOWER(:name)
    ORDER BY v.sort_order ASC
    `,
      { name }
    );

    return rows;
  }

  private async insertDimensionValues(trx: Knex.Transaction, dimensionPresetId: number, dimensionValues: PresetDimensionValueSchema[]) {
    const payload = dimensionValues.map((v, idx) => ({
      name: v.name,
      hex_color: v.hexColor ?? null,
      sort_order: idx + 1
    }));

    await trx.raw(
      `
      INSERT INTO variant_dimension_values_presets (
        dimension_preset_id,
        name,
        hex_color,
        sort_order
      )
      SELECT
        :dimensionPresetId,
        v.name,
        v.hex_color,
        v.sort_order
      FROM jsonb_to_recordset(:values::jsonb) AS v(
        name text,
        hex_color text,
        sort_order int
      )
    `,
      {
        dimensionPresetId,
        values: JSON.stringify(payload)
      }
    );
  }

  async reorderDimensionValues(trx: Knex.Transaction, input: PresetDimensionValueReorderSchema) {
    const ids = input.map((i) => i.id);

    const cases = input.map((i) => `WHEN ${i.id} THEN ${i.sortOrder}`).join(" ");

    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
        UPDATE variant_dimension_values_presets
          SET sort_order = CASE id
          ${cases}
        END
        WHERE id = ANY(:ids)
        RETURNING id
        `,
      { ids }
    );

    if (!rows.length) {
      throw AppError.notFound("Preset dimension value not found or invalid");
    }
  }
}
