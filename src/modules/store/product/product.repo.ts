import { db } from "@/infra/db/knex";
import { BaseQueryParams, ProductByCategoryQueryParams, ProductByCollectionQueryParams, ProductBySearchQueryParams } from "./product.schema";
import { AppError } from "@/errors/app-error";
import { decodeCursor, encodeCursor } from "@/utils/pagination-cursor";
import { DimensionRow, ImageRow, ProductBasicRow, ProductCardRow, ProductFilterRow, VariantDetailRow, VariantRow } from "./product.types";
import { buildProductCardJoins } from "./sql/product-card.sql";
import { getVariantDimensions, getVariantValues } from "@/shared/cache/variant-filter/variant-filter.cache";

export class ProductRepo {
  async getProductDetailById(productId: number) {
    // Product Basic
    const { rows } = await db.raw<{
      rows: ProductBasicRow[];
    }>(
      `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.status,
      p.is_variant,
      c.name AS category_name,
      c.slug_path AS category_slug_path,
      p.updated_at
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = :productId
    LIMIT 1
    `,
      { productId }
    );

    const product = rows[0];
    if (!product) {
      throw AppError.notFound("Product not found");
    }

    // Variants + Options
    const { rows: variantRows } = await db.raw<{
      rows: VariantRow[];
    }>(
      `
    SELECT
      v.id AS variant_id,
      d.normalized_name AS dimension_key,
      dv.normalized_value AS value_key,
      v.is_primary,
      v.updated_at
    FROM product_variants v
    LEFT JOIN product_variant_option_values pov ON pov.variant_id = v.id
    LEFT JOIN product_variant_dimensions d ON d.id = pov.dimension_id
    LEFT JOIN product_variant_dimension_values dv ON dv.id = pov.value_id
    WHERE v.product_id = :productId
      AND v.status <> 'ARCHIVED'
    ORDER BY v.is_primary DESC, v.id ASC
    `,
      { productId: product.id }
    );

    // Dimensions
    const { rows: dimensionRows } = await db.raw<{
      rows: DimensionRow[];
    }>(
      `
    SELECT
      d.normalized_name AS dimension_key,
      d.display_name AS dimension_label,
      dv.normalized_value AS value_key,
      dv.display_value AS value_label,
      dv.hex_color
    FROM product_variant_dimensions d
    JOIN product_variant_dimension_values dv
      ON dv.dimension_id = d.id
    WHERE d.product_id = :productId
    ORDER BY d.id ASC, dv.id ASC
    `,
      { productId: product.id }
    );

    // Images
    const { rows: imageRows } = await db.raw<{
      rows: ImageRow[];
    }>(
      `
      -- PRODUCT IMAGES (PRIORITY 0)
    SELECT
      pi.id AS image_id,
      im.image_key,
      NULL AS dimension_key,
      NULL AS value_key,
      'product' AS image_type,
      0 AS priority,
      pi.sort_order AS sort_order
    FROM product_images pi
    JOIN images_metadata im ON im.id = pi.image_id
      WHERE pi.product_id = :productId
      AND pi.is_orphan = false

    UNION ALL

    -- VARIANT IMAGES (PRIORITY 1)
    SELECT
      pvi.id AS image_id,
      im.image_key,
      sig.dimension_key,
      sig.value_key,
      'variant' AS image_type,
      1 AS priority,
      NULL AS sort_order
    FROM product_variant_images pvi
    JOIN images_metadata im ON im.id = pvi.image_id
    JOIN product_variant_image_signatures sig
      ON sig.variant_image_id = pvi.id
    WHERE pvi.product_id = :productId
      AND pvi.is_orphan = false

    ORDER BY
      priority ASC,
      sort_order ASC NULLS LAST,
      image_id ASC
        `,
      { productId: product.id }
    );

    const etagSeed = this.buildProductDetailETagSeed(product, variantRows);

    return {
      product,
      variantRows,
      dimensionRows,
      imageRows,
      etagSeed
    };
  }

  async getVariantDetail(productId: number, variantId: number) {
    const { rows } = await db.raw<{ rows: VariantDetailRow[] }>(
      `
    SELECT
      v.id AS variant_id,
      v.price,
      v.stock,
      v.sku,
      v.currency,
      v.weight,
      v.weight_unit,
      v.status AS variant_status,
      p.status AS product_status,
      v.updated_at

    FROM product_variants v
    JOIN products p ON p.id = v.product_id

    WHERE p.id = :productId
      AND v.id = :variantId
      AND v.status <> 'ARCHIVED'

    LIMIT 1
    `,
      { productId, variantId }
    );

    const row = rows[0];

    if (!row) {
      throw AppError.notFound("Variant not found");
    }

    const etagSeed = this.buildVariantDetailETagSeed(row);

    return { row, etagSeed };
  }

  async getByCategoryIdPath(idPath: string, qParams: ProductByCategoryQueryParams) {
    const scopeSql = `p.category_id IN (
      SELECT id
      FROM categories
      WHERE id_path LIKE :idPathPrefix
    )`;

    const scopeBindings = {
      idPathPrefix: `${idPath}%`
    };

    const result = await this.executeProductListing({
      scopeSql,
      scopeBindings,
      qParams,
      withDimension: true
    });

    const etagSeed = await this.buildProductListingETagSeed(`category:${idPath}`, result.whereSql, result.bindings, qParams);

    return {
      rows: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      etagSeed
    };
  }

  async getByCollectionSlug(qParams: ProductByCollectionQueryParams) {
    const { slug } = qParams;

    const { rows } = await db.raw<{ rows: { id: number }[] }>(
      `
    SELECT id
    FROM collections
    WHERE slug = :slug
      AND status = 'ACTIVE'
    LIMIT 1
    `,
      { slug }
    );

    const collection = rows[0];
    if (!collection) {
      throw AppError.notFound("Collection not found");
    }

    const scopeSql = `EXISTS (
    SELECT 1
    FROM product_collections pc
    WHERE pc.product_id = p.id
      AND pc.collection_id = :collectionId
  )`;

    const result = await this.executeProductListing({
      scopeSql,
      scopeBindings: { collectionId: collection.id },
      qParams,
      withDimension: false
    });

    const etagSeed = await this.buildProductListingETagSeed(`collection:${slug}`, result.whereSql, result.bindings, qParams);

    return {
      rows: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      etagSeed
    };
  }

  async getBySearch(qParams: ProductBySearchQueryParams) {
    const { q } = qParams;

    if (!q) {
      throw AppError.badRequest("Search query is required");
    }

    const scopeSql = `
    to_tsvector('simple', p.name)
    @@ plainto_tsquery('simple', :searchQuery)
  `;

    const scopeBindings = {
      searchQuery: q
    };

    const result = await this.executeProductListing({
      scopeSql,
      scopeBindings,
      qParams,
      withDimension: true,
      withRank: true
    });

    const etagSeed = await this.buildProductListingETagSeed(`search:${q}`, result.whereSql, result.bindings, qParams);

    return {
      rows: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      etagSeed
    };
  }

  async getSearchFilters(q: string) {
    if (!q) {
      throw AppError.badRequest("Search query is required");
    }

    // FILTER VALUES
    const { rows } = await db.raw<{
      rows: ProductFilterRow[];
    }>(
      `
    SELECT
      t.dimension_name,
      t.dimension_display_name,
      t.value_normalized,
      t.value_display,
      t.hex_color,
      COUNT(*)::int AS product_count
    FROM (
      SELECT DISTINCT
        p.id AS product_id,
        d.normalized_name AS dimension_name,
        d.display_name AS dimension_display_name,
        dv.normalized_value AS value_normalized,
        dv.display_value AS value_display,
        dv.hex_color
      FROM products p
      JOIN product_variants v
        ON v.product_id = p.id
       AND v.status = 'ACTIVE'
      JOIN product_variant_option_values pov
        ON pov.variant_id = v.id
      JOIN product_variant_dimensions d
        ON d.id = pov.dimension_id
      JOIN product_variant_dimension_values dv
        ON dv.id = pov.value_id
      WHERE
        p.status = 'ACTIVE'
        AND to_tsvector('simple', p.name)
          @@ plainto_tsquery('simple', :searchQuery)
    ) t
    GROUP BY
      t.dimension_name,
      t.dimension_display_name,
      t.value_normalized,
      t.value_display,
      t.hex_color
    ORDER BY
      t.dimension_name,
      t.value_display
    `,
      {
        searchQuery: q
      }
    );

    // ETAG
    const { rows: metaRows } = await db.raw<{
      rows: { max_updated_at: Date | null }[];
    }>(
      `
    SELECT MAX(v.updated_at) AS max_updated_at
    FROM products p
    JOIN product_variants v
      ON v.product_id = p.id
     AND v.status = 'ACTIVE'
    WHERE
      p.status = 'ACTIVE'
      AND to_tsvector('simple', p.name)
          @@ plainto_tsquery('simple', :searchQuery)
    `,
      {
        searchQuery: q
      }
    );

    const meta = metaRows[0];

    const etagSeed = `search-filters:${q}:${meta?.max_updated_at?.toISOString() ?? "none"}:${rows.length}`;

    return {
      rows,
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

  private buildProductFilters(qParams: BaseQueryParams) {
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

  private buildCursorCondition(sortColumn: string, sortDir: "asc" | "desc", cursor: string | undefined, bindings: Record<string, unknown>) {
    const decodedCursor = decodeCursor(cursor);

    if (!decodedCursor) {
      return "";
    }

    const operator = sortDir === "asc" ? ">" : "<";

    bindings.cursorValue = decodedCursor.value;
    bindings.cursorId = decodedCursor.id;

    return `
    AND (
      ${sortColumn} ${operator} :cursorValue
      OR (${sortColumn} = :cursorValue AND p.id ${operator} :cursorId)
    )
  `;
  }

  private buildDimensionConditions(
    dimensionFilters: {
      dimensionName: string;
      values: string[];
    }[]
  ) {
    const conditions: string[] = [];
    const bindings: Record<string, unknown> = {};

    dimensionFilters.forEach((filter, index) => {
      if (!filter.values.length) return;

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

  private extractDimensionFilters(qParams: Record<string, unknown>) {
    const BASE_KEYS = new Set(["slugPath", "slug", "q", "limit", "cursor", "priceMin", "priceMax", "sortBy", "sortDir"]);

    return Object.entries(qParams)
      .filter(([key, value]) => {
        if (BASE_KEYS.has(key)) return false;
        if (value === undefined || value === null) return false;
        if (value === "") return false;
        return true;
      })
      .map(([dimensionName, value]) => ({
        dimensionName,
        values: String(value)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      }));
  }

  private async executeProductListing(params: {
    scopeSql: string;
    scopeBindings: Record<string, unknown>;
    qParams: BaseQueryParams;
    withDimension?: boolean;
    withRank?: boolean;
  }) {
    const { scopeSql, scopeBindings, qParams, withDimension = false, withRank = false } = params;

    const { limit, sortBy, sortDir, cursor } = qParams;

    // BASE PRODUCT FILTERS
    const { conditions: productConditions, bindings: productBindings } = this.buildProductFilters(qParams);

    // DIMENSION FILTERS (OPTIONAL)
    let dimensionConditions: string[] = [];
    let dimensionBindings: Record<string, unknown> = {};

    if (withDimension) {
      const extracted = this.extractDimensionFilters(qParams);

      const validated = await this.validateDimensionFilters(extracted);

      const dim = this.buildDimensionConditions(validated);

      dimensionConditions = dim.conditions;
      dimensionBindings = dim.bindings;
    }

    const allConditions = [scopeSql, ...productConditions, ...dimensionConditions];

    const whereSql = allConditions.length > 0 ? `WHERE ${allConditions.join(" AND ")}` : "";

    const bindings: Record<string, unknown> = {
      ...scopeBindings,
      ...productBindings,
      ...dimensionBindings
    };

    // SEARCH RANK + BOOST
    const rankSelect = withRank
      ? `
      (
        ts_rank(
          to_tsvector('simple', p.name),
          plainto_tsquery('simple', :searchQuery)
        )
        +
        CASE
          WHEN LOWER(p.name) = LOWER(:searchQuery) THEN 1
          ELSE 0
        END
        +
        CASE
          WHEN LOWER(p.name) LIKE LOWER(:searchQuery || '%') THEN 0.5
          ELSE 0
        END
      ) AS search_rank,
    `
      : "";

    // SORTING
    let sortColumn = "p.created_at";

    if (withRank) {
      sortColumn = "search_rank";
    } else if (sortBy === "price") {
      sortColumn = "v.price";
    }

    // CURSOR
    const cursorCondition = this.buildCursorCondition(sortColumn, sortDir, cursor, bindings);

    // MAIN QUERY
    const { rows } = await db.raw<{ rows: ProductCardRow[] }>(
      `
    SELECT
      ${rankSelect}
      p.id,
      p.name,
      p.slug,
      im.image_key,
      v.price AS display_price,
      p.created_at

    FROM products p
    ${buildProductCardJoins("p")}

    ${whereSql}
    ${cursorCondition}

    ORDER BY ${sortColumn} ${sortDir}, p.id ${sortDir}
    LIMIT :limitPlusOne
    `,
      {
        ...bindings,
        limitPlusOne: limit + 1
      }
    );

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor: string | null = null;

    if (hasMore && items.length > 0) {
      const last = items[items.length - 1]!;

      const value = withRank ? (last as any).search_rank : sortBy === "price" ? last.display_price : last.created_at.toISOString();

      nextCursor = encodeCursor({
        value,
        id: last.id
      });
    }

    return {
      items,
      nextCursor,
      hasMore,
      whereSql,
      bindings
    };
  }

  private buildProductDetailETagSeed(product: ProductBasicRow, variantRows: VariantRow[]) {
    const [first, ...rest] = variantRows;

    if (!first) {
      throw new Error("Invariant violation: product has no variants");
    }

    const maxVariantUpdated = rest.reduce((acc, v) => (v.updated_at > acc ? v.updated_at : acc), first.updated_at);

    return `product-detail:${product.id}:${product.updated_at.toISOString()}:${maxVariantUpdated.toISOString()}`;
  }

  private buildVariantDetailETagSeed(row: VariantDetailRow) {
    return `variant-detail:${row.variant_id}:${row.updated_at.toISOString()}:${row.price}:${row.stock}`;
  }

  private async buildProductListingETagSeed(scopeKey: string, whereSql: string, bindings: Record<string, unknown>, qParams: BaseQueryParams) {
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
    JOIN product_variants v
      ON v.product_id = p.id
     AND v.status = 'ACTIVE'

    ${whereSql}
    `,
      bindings
    );

    const meta = rows[0];

    return `
${scopeKey}:
${meta?.max_product_updated_at?.toISOString() ?? "none"}:
${meta?.max_variant_updated_at?.toISOString() ?? "none"}:
${JSON.stringify({
  priceMin: qParams.priceMin,
  priceMax: qParams.priceMax,
  sortBy: qParams.sortBy,
  sortDir: qParams.sortDir
})}
`;
  }

  private async validateDimensionFilters(filters: { dimensionName: string; values: string[] }[]) {
    const dimensionSet = new Set(await getVariantDimensions());
    const valueMap = await getVariantValues();

    const result: { dimensionName: string; values: string[] }[] = [];

    for (const filter of filters) {
      if (!dimensionSet.has(filter.dimensionName)) {
        throw AppError.badRequest(`Invalid filter: ${filter.dimensionName}`);
      }

      const allowedValues = new Set(valueMap[filter.dimensionName] ?? []);

      const invalidValue = filter.values.find((v) => !allowedValues.has(v));

      if (invalidValue) {
        throw AppError.badRequest(`Invalid value '${invalidValue}' for dimension '${filter.dimensionName}'`);
      }

      result.push(filter);
    }

    return result;
  }
}
