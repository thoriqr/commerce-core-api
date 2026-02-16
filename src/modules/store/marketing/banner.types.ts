export type BannerRow = {
  id: number;
  title: string;
  placement: string;
  image_key: string;
  target_type: string;
  target_entity_id: number | null;
  sort_order: number;
  max_updated_at: string;
  total: number;
};
