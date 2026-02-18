import { db } from "@/infra/db/knex";
import { ProductByCategoryQueryParams } from "./product.schema";
import { AppError } from "@/errors/app-error";
import { decodeCursor, encodeCursor } from "@/utils/pagination-cursor";
import { ProductCardRow } from "./product.types";

export class ProductRepo {
  async getByCategoryIdPath(idPath: string, qParams: ProductByCategoryQueryParams) {
    const { limit, sortBy, sortDir, cursor } = qParams;

    // ===============================
    // 1️⃣ CATEGORY SCOPE
    // ===============================
    const { sql: categorySql, bindings: categoryBindings } = this.buildCategoryScope(idPath);

    // ===============================
    // 2️⃣ BASE PRODUCT FILTERS
    // ===============================
    const { conditions: productConditions, bindings: productBindings } = this.buildProductFilters(qParams);

    // ===============================
    // 3️⃣ DIMENSION FILTERS
    // ===============================
    const dimensionFilters = this.extractDimensionFilters(qParams);

    const { conditions: dimensionConditions, bindings: dimensionBindings } = this.buildDimensionConditions(dimensionFilters);

    // ===============================
    // 4️⃣ MERGE ALL CONDITIONS
    // ===============================
    const allConditions = [categorySql, ...productConditions, ...dimensionConditions];

    const whereSql = allConditions.length > 0 ? `WHERE ${allConditions.join(" AND ")}` : "";

    const bindings: Record<string, unknown> = {
      ...categoryBindings,
      ...productBindings,
      ...dimensionBindings
    };

    // ===============================
    // 5️⃣ SORTING
    // ===============================
    const sortColumn = sortBy === "price" ? "v.price" : "p.created_at";

    // ===============================
    // 6️⃣ CURSOR CONDITION
    // ===============================
    let cursorCondition = "";
    const decodedCursor = decodeCursor(cursor);

    if (decodedCursor) {
      const operator = sortDir === "asc" ? ">" : "<";

      cursorCondition = `
      AND (
        ${sortColumn} ${operator} :cursorValue
        OR (${sortColumn} = :cursorValue AND p.id ${operator} :cursorId)
      )
    `;

      bindings.cursorValue = decodedCursor.value;
      bindings.cursorId = decodedCursor.id;
    }

    // ===============================
    // 7️⃣ MAIN QUERY
    // ===============================
    const { rows } = await db.raw<{ rows: ProductCardRow[] }>(
      `
    SELECT
      p.id,
      p.name,
      p.slug,
      c.slug_path AS category_slug_path,
      im.image_key,
      v.price AS display_price,
      p.created_at

    FROM products p

    JOIN categories c ON c.id = p.category_id

    -- Primary variant fallback
    JOIN LATERAL (
      SELECT v.id, v.price
      FROM product_variants v
      WHERE v.product_id = p.id
        AND v.status = 'ACTIVE'
      ORDER BY v.is_primary DESC, v.id ASC
      LIMIT 1
    ) v ON true

    -- Primary image fallback
    JOIN LATERAL (
      SELECT pi.image_id
      FROM product_images pi
      WHERE pi.product_id = p.id
        AND pi.is_orphan = false
      ORDER BY pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ) img ON true

    JOIN images_metadata im ON im.id = img.image_id

    ${whereSql}
    ${decodedCursor ? cursorCondition : ""}

    ORDER BY ${sortColumn} ${sortDir}, p.id ${sortDir}
    LIMIT :limitPlusOne
    `,
      {
        ...bindings,
        limitPlusOne: limit + 1
      }
    );

    // ===============================
    // 8️⃣ PAGINATION RESULT
    // ===============================
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;

    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;

      const value = sortBy === "price" ? last.display_price : last.created_at.toISOString();

      nextCursor = encodeCursor({
        value,
        id: last.id
      });
    }

    const etagSeed = await this.buildListingETagSeed(idPath, qParams, whereSql, bindings);

    return {
      items,
      nextCursor,
      hasMore,
      etagSeed
    };
  }

  async getIdPathBySlugPath(slugPath: string) {
    const { rows } = await db.raw<{ rows: { id_path: string }[] }>(
      `
      SELECT id, id_path FROM categories
      WHERE slug_path = :slugPath
       AND status = 'ACTIVE'
      LIMIT 1
    `,
      { slugPath }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Category not found");
    }

    return row.id_path;
  }

  private buildDimensionConditions(dimensionFilters: ReturnType<typeof this.extractDimensionFilters>) {
    const conditions: string[] = [];
    const bindings: Record<string, unknown> = {};

    dimensionFilters.forEach((filter, index) => {
      const dimKey = `dim${index}`;
      const valKey = `vals${index}`;

      conditions.push(`
      EXISTS (
        SELECT 1
        FROM product_variants v2
        JOIN product_variant_option_values pov
          ON pov.variant_id = v2.id
        JOIN product_variant_dimensions d
          ON d.id = pov.dimension_id
        JOIN product_variant_dimension_values dv
          ON dv.id = pov.value_id
        WHERE v2.product_id = p.id
          AND v2.status = 'ACTIVE'
          AND d.normalized_name = :${dimKey}
          AND dv.normalized_value = ANY(:${valKey})
      )
    `);

      bindings[dimKey] = filter.dimensionName;
      bindings[valKey] = filter.values;
    });

    return { conditions, bindings };
  }

  private extractDimensionFilters(qParams: ProductByCategoryQueryParams) {
    const BASE_KEYS = new Set(["slugPath", "limit", "cursor", "priceMin", "priceMax", "sortBy", "sortDir"]);

    return Object.entries(qParams)
      .filter(([key]) => !BASE_KEYS.has(key))
      .map(([dimensionName, value]) => ({
        dimensionName,
        values: String(value).split(",")
      }));
  }

  private buildProductFilters(qParams: ProductByCategoryQueryParams) {
    const { priceMin, priceMax } = qParams;

    const conditions: string[] = [];
    const bindings: Record<string, unknown> = {};

    conditions.push(`p.status = 'ACTIVE'`);

    if (priceMin !== undefined) {
      conditions.push(`v.price >= :priceMin`);
      bindings.priceMin = priceMin;
    }

    if (priceMax !== undefined) {
      conditions.push(`v.price <= :priceMax`);
      bindings.priceMax = priceMax;
    }

    return { conditions, bindings };
  }

  private buildCategoryScope(idPath: string) {
    return {
      sql: `c.id_path LIKE :idPathPrefix`,
      bindings: {
        idPathPrefix: `${idPath}%`
      }
    };
  }

  private async buildListingETagSeed(idPath: string, qParams: ProductByCategoryQueryParams, whereSql: string, bindings: Record<string, unknown>) {
    const { rows } = await db.raw<{
      rows: {
        max_product_updated_at: Date | null;
        max_variant_updated_at: Date | null;
      }[];
    }>(
      `
    SELECT
      MAX(p.updated_at) AS max_product_updated_at,
      MAX(v.updated_at) AS max_variant_updated_at

    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN product_variants v
      ON v.product_id = p.id
     AND v.status = 'ACTIVE'

    ${whereSql}
    `,
      bindings
    );

    const meta = rows[0];

    const seed = `
    category-products:
    ${idPath}:
    ${meta?.max_product_updated_at?.toISOString() ?? "none"}:
    ${meta?.max_variant_updated_at?.toISOString() ?? "none"}:
    ${JSON.stringify({
      priceMin: qParams.priceMin,
      priceMax: qParams.priceMax,
      sortBy: qParams.sortBy,
      sortDir: qParams.sortDir,
      dimensions: this.extractDimensionFilters(qParams)
    })}
  `;

    return seed;
  }
}
