import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop index used target_id
    DROP INDEX IF EXISTS idx_marketing_banners_target;

    -- Drop target_value
    ALTER TABLE marketing_banners
      DROP COLUMN IF EXISTS target_value;

    -- Rename target_id → target_entity_id
    ALTER TABLE marketing_banners
      RENAME COLUMN target_id TO target_entity_id;

    -- Add target_config (future rule support)
    ALTER TABLE marketing_banners
      ADD COLUMN target_config jsonb NULL;

    -- Recreate index 
    CREATE INDEX idx_marketing_banners_target
      ON marketing_banners (target_type, target_entity_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Drop new index
    DROP INDEX IF EXISTS idx_marketing_banners_target;

    -- Drop target_config
    ALTER TABLE marketing_banners
      DROP COLUMN IF EXISTS target_config;

    -- Rename target_entity_id → target_id
    ALTER TABLE marketing_banners
      RENAME COLUMN target_entity_id TO target_id;

    -- Restore target_value
    ALTER TABLE marketing_banners
      ADD COLUMN target_value text NOT NULL DEFAULT '';

    -- Recreate old index
    CREATE INDEX idx_marketing_banners_target
      ON marketing_banners (target_type, target_id);
  `);
}
