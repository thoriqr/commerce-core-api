import { Knex } from "knex";
import slugify from "slugify";

export const toBaseSlug = (name: string) =>
  slugify(name, {
    lower: true,
    strict: true,
    trim: true
  });

export const generateUniqueSlug = async (trx: Knex.Transaction, name: string): Promise<string> => {
  const baseSlug = toBaseSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { rows } = await trx.raw<{ rows: { id: string }[] }>(
      `
      SELECT id
      FROM products
      WHERE slug = :slug
      LIMIT 1
      `,
      { slug }
    );

    if (!rows[0]) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};
