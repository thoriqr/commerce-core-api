export interface VariantPresetListDTO {
  id: number;
  name: string;
  valuesCount: number;
}

export interface VariantPresetDetailDTO {
  id: number;
  name: string;
  values: { id: string; name: string; hexColor: string }[];
}

export interface VariantPresetDimensionOptionDTO {
  value: string;
  label: string;
}

export interface VariantPresetDimensionValueDTO {
  value: string;
  label: string;
  hexColor: string;
}
