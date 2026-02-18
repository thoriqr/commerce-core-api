import { db } from "@/infra/db/knex";
import { CategoryBreadcrumbRow, CategoryChildRow, CategoryDetailRow, CategoryFilterRow, CategoryRow, CategoryTopLevelRow } from "./category.types";
import { AppError } from "@/errors/app-error";

export class CategoryRepo {
  async getMegaMenuTree() {
    const { rows } = await db.raw<{ rows: CategoryRow[] }>(`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      c.id_path,
      c.sort_order
    FROM categories c
    WHERE c.status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1
        FROM categories parent
        WHERE parent.id::text = ANY(string_to_array(c.id_path, '/'))
          AND parent.status = 'INACTIVE'
      )
    ORDER BY
      string_to_array(c.id_path, '/')::int[],
      c.sort_order ASC,
      c.id ASC
  `);

    const { rows: metaRows } = await db.raw<{ rows: { max_updated_at: string; total: number }[] }>(`
    SELECT 
      MAX(updated_at) AS max_updated_at,
      COUNT(*) AS total
    FROM categories
    WHERE status = 'ACTIVE'
  `);

    const meta = metaRows[0];

    const etagSeed = meta ? `categories:${meta.max_updated_at}:${meta.total}` : `categories:empty`;

    return { rows, etagSeed };
  }

  async getTopLevelCategories() {
    const { rows } = await db.raw<{ rows: CategoryTopLevelRow[] }>(`
      SELECT
        id,
        name,
        slug,
        sort_order,
        updated_at
      FROM categories
      WHERE parent_id IS NULL
        AND status = 'ACTIVE'
      ORDER BY sort_order ASC, id ASC
    `);

    const maxUpdatedAt = rows.length ? Math.max(...rows.map((r) => r.updated_at.getTime())) : 0;

    const etagSeed = rows.length ? `top-level:${rows.length}:${maxUpdatedAt}` : "top-level:empty";

    return { rows, etagSeed };
  }

  async getCategoryDetail(slugPath: string) {
    // 1️⃣ current category
    const { rows } = await db.raw<{ rows: CategoryDetailRow[] }>(
      `
      SELECT id, name, description, slug, slug_path, id_path, updated_at
      FROM categories
      WHERE slug_path = :slugPath
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      { slugPath }
    );

    const current = rows[0];
    if (!current) {
      throw AppError.notFound("Category not found");
    }

    // 2️⃣ breadcrumb chain
    const { rows: breadcrumbRows } = await db.raw<{
      rows: CategoryBreadcrumbRow[];
    }>(
      `
      SELECT id, name, slug, slug_path, updated_at
      FROM categories
      WHERE id::text = ANY(string_to_array(:idPath, '/'))
        AND status = 'ACTIVE'
      ORDER BY array_position(string_to_array(:idPath, '/'), id::text)
      `,
      { idPath: current.id_path }
    );

    // 3️⃣ children
    const { rows: childrenRows } = await db.raw<{
      rows: CategoryChildRow[];
    }>(
      `
      SELECT id, name, slug, slug_path
      FROM categories
      WHERE parent_id = :parentId
        AND status = 'ACTIVE'
      ORDER BY sort_order ASC, id ASC
      `,
      { parentId: current.id }
    );

    // 4️⃣ ETag seed
    const maxUpdatedAt = [current.updated_at, ...breadcrumbRows.map((b) => b.updated_at)].reduce(
      (acc, d) => (!acc || d > acc ? d : acc),
      null as Date | null
    );

    const etagSeed = `category:${slugPath}:${maxUpdatedAt?.toISOString() ?? "none"}:${childrenRows.length}`;

    return {
      current,
      breadcrumbRows,
      childrenRows,
      etagSeed
    };
  }

  async getCategoryFilters(slugPath: string) {
    // 1️⃣ Resolve category
    const { rows: targetRows } = await db.raw<{
      rows: { id_path: string }[];
    }>(
      `
    SELECT id_path
    FROM categories
    WHERE slug_path = :slugPath
      AND status = 'ACTIVE'
    LIMIT 1
    `,
      { slugPath }
    );

    const target = targetRows[0];
    if (!target) {
      throw AppError.notFound("Category not found");
    }

    // 2️⃣ DISTINCT first (important)
    const { rows } = await db.raw<{ rows: CategoryFilterRow[] }>(
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
        dv.hex_color AS hex_color
      FROM products p
      JOIN categories c ON c.id = p.category_id
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
        AND c.id_path LIKE :idPathPrefix
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
        idPathPrefix: `${target.id_path}%`
      }
    );

    // 3️⃣ ETag (consistent subtree logic)
    const { rows: metaRows } = await db.raw<{
      rows: { max_updated_at: string | null }[];
    }>(
      `
    SELECT MAX(v.updated_at) AS max_updated_at
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN product_variants v ON v.product_id = p.id
    WHERE
      p.status = 'ACTIVE'
      AND v.status = 'ACTIVE'
      AND c.id_path LIKE :idPathPrefix
    `,
      { idPathPrefix: `${target.id_path}%` }
    );

    const meta = metaRows[0];

    const etagSeed = `category-filters:${slugPath}:${meta?.max_updated_at ?? "none"}:${rows.length}`;

    return {
      rows,
      etagSeed
    };
  }
}
