import { Knex } from "knex";
import slugify from "slugify";

export const toBaseSlug = (value: string) =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });

type GenerateCategorySlugInput = {
  name: string;
  parentId: number | null;
  slugFromClient?: string | null;
  excludeId?: number;
};

export const generateUniqueCategorySlug = async (trx: Knex.Transaction, input: GenerateCategorySlugInput): Promise<string> => {
  const baseSource = input.slugFromClient ?? input.name;
  const baseSlug = toBaseSlug(baseSource);

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
        SELECT id
        FROM categories
        WHERE parent_id IS NOT DISTINCT FROM :parentId
          AND slug = :slug
          AND (:excludeId IS NULL OR id <> :excludeId)
        LIMIT 1
      `,
      {
        parentId: input.parentId,
        slug,
        excludeId: input.excludeId ?? null
      }
    );

    if (!rows[0]) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
