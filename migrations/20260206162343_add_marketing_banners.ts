import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE marketing_banners (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      placement TEXT NOT NULL,
      image_id BIGINT NOT NULL,
      target_type TEXT NOT NULL,
      target_value TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NULL,
      CONSTRAINT fk_marketing_banners_image
        FOREIGN KEY (image_id)
        REFERENCES images_metadata(id)
        ON DELETE RESTRICT
    );

    CREATE INDEX idx_marketing_banners_placement_active
      ON marketing_banners (placement, is_active);

    CREATE INDEX idx_marketing_banners_placement_sort
      ON marketing_banners (placement, sort_order);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS marketing_banners;
  `);
}
