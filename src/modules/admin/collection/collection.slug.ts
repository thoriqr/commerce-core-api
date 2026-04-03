import { Knex } from "knex";
import slugify from "slugify";

export const toBaseSlug = (name: string) =>
  slugify(name, {
    lower: true,
    strict: true,
    trim: true
  });

type GenerateCollectionSlugInput = {
  name: string;
  slugFromClient?: string | null;
  excludeId?: number;
};

export const generateUniqueSlug = async (trx: Knex.Transaction, input: GenerateCollectionSlugInput): Promise<string> => {
  const baseSource = input.slugFromClient ?? input.name;
  const baseSlug = toBaseSlug(baseSource);

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { rows } = await trx.raw<{ rows: { id: string }[] }>(
      `
        SELECT id
        FROM collections
        WHERE slug = :slug
          AND (:excludeId::bigint IS NULL OR id <> :excludeId::bigint)
        LIMIT 1
      `,
      { slug, excludeId: input.excludeId ?? null }
    );

    if (!rows[0]) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
