export type VariantPresetListRow = {
  id: number;
  name: string;
  values_count: number;
};

export type VariantPresetDetailRow = {
  id: number;
  name: string;
  value_id: number;
  value_name: string;
  hex_color: string | null;
  sort_order: number;
};

export type VariantPresetDimensionOptionRow = {
  id: number;
  name: string;
};

export type VariantPresetDimensionValueRow = { id: number; name: string; hex_color: string | null };
