import { db } from "@/infra/db/knex";
import { BreadcrumbRow, CategoryMetadataRow, CategoryRow, CategoryTopLevelRow } from "./category.types";
import { mapMegaMenu } from "./category.mapper";
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

    const nodes = mapMegaMenu(rows);

    return { nodes, etagSeed };
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

  async getBreadcrumbBySlugPath(slugPath: string) {
    // 1️⃣ Ambil category target
    const { rows } = await db.raw<{ rows: BreadcrumbRow[] }>(
      `
      SELECT id, name, slug, slug_path, id_path, updated_at
      FROM categories
      WHERE slug_path = :slugPath
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      { slugPath }
    );

    const target = rows[0];
    if (!target) {
      throw AppError.notFound("Category not found");
    }

    // 2️⃣ Ambil seluruh chain berdasarkan id_path
    const { rows: chainRows } = await db.raw<{ rows: BreadcrumbRow[] }>(
      `
      SELECT id, name, slug, slug_path, id_path, updated_at
      FROM categories
      WHERE id::text = ANY(string_to_array(:idPath, '/'))
        AND status = 'ACTIVE'
      ORDER BY array_position(string_to_array(:idPath, '/'), id::text)
      `,
      { idPath: target.id_path }
    );

    // 3️⃣ ETag seed
    const maxUpdatedAt = chainRows.reduce((acc, r) => (!acc || r.updated_at > acc ? r.updated_at : acc), null as Date | null);

    const etagSeed = `breadcrumb:${slugPath}:${maxUpdatedAt?.toISOString() ?? "none"}:${chainRows.length}`;

    return {
      rows,
      etagSeed
    };
  }

  async getMetadataBySlugPath(slugPath: string) {
    const { rows } = await db.raw<{ rows: CategoryMetadataRow[] }>(
      `
      SELECT
        name,
        description,
        slug_path,
        updated_at
      FROM categories
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

    const etagSeed = `category-meta:${row.updated_at.toISOString()}`;

    return {
      row,
      etagSeed
    };
  }
}
