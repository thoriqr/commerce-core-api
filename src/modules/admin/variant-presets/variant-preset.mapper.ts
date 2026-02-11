import { VariantPresetDetailDTO, VariantPresetDimensionOptionDTO, VariantPresetDimensionValueDTO, VariantPresetListDTO } from "./variant-preset.dto";
import {
  VariantPresetDetailRow,
  VariantPresetDimensionOptionRow,
  VariantPresetDimensionValueRow,
  VariantPresetListRow
} from "./variant-preset.types";

export function mapVariantPresetList(rows: VariantPresetListRow[]): VariantPresetListDTO[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    valuesCount: r.values_count
  }));
}

export function mapVariantPresetDetail(rows: VariantPresetDetailRow[]): VariantPresetDetailDTO {
  const first = rows[0]!;

  return {
    id: first.id,
    name: first.name,
    values: rows
      .filter((r) => r.value_id !== null)
      .map((r) => ({
        id: String(r.value_id),
        name: r.value_name,
        hexColor: r.hex_color ? String(r.hex_color) : ""
      }))
  };
}

export function mapVariantPresetDimensionOption(rows: VariantPresetDimensionOptionRow[]): VariantPresetDimensionOptionDTO[] {
  return rows.map((r) => ({
    value: String(r.id),
    label: r.name
  }));
}

export function mapVariantPresetDimensionValue(rows: VariantPresetDimensionValueRow[]): VariantPresetDimensionValueDTO[] {
  return rows.map((r) => ({
    value: String(r.id),
    label: r.name,
    hexColor: r.hex_color ? String(r.hex_color) : ""
  }));
}
