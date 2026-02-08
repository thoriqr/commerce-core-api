import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE marketing_banners
    ADD COLUMN status text;

    UPDATE marketing_banners
    SET status = 'ACTIVE';

    ALTER TABLE marketing_banners
    ALTER COLUMN status SET NOT NULL;

    ALTER TABLE marketing_banners
    ADD CONSTRAINT chk_marketing_banners_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

    ALTER TABLE marketing_banners
    DROP COLUMN is_active;

    DROP INDEX IF EXISTS idx_marketing_banners_placement_active;

    CREATE INDEX idx_marketing_banners_placement_status
    ON marketing_banners (placement, status);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP INDEX IF EXISTS idx_marketing_banners_placement_status;

    ALTER TABLE marketing_banners
    DROP CONSTRAINT IF EXISTS chk_marketing_banners_status;

    ALTER TABLE marketing_banners
    ADD COLUMN is_active bool NOT NULL DEFAULT true;

    ALTER TABLE marketing_banners
    DROP COLUMN status;

    CREATE INDEX idx_marketing_banners_placement_active
    ON marketing_banners (placement, is_active);
  `);
}
