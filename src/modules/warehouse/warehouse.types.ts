export type InputWarehouse = {
  name: string;
  provinceId: number;
  provinceName: string;
  cityId: number;
  cityName: string;
  districtId: number;
  districtName: string;
  postalCode: string | null;
};

export type WarehousesRow = {
  id: number;
  name: string;
  shipping_city_id: number;
  shipping_city_name: string;
  shipping_province_id: number;
  shipping_province_name: string;
  shipping_district_id: number;
  shipping_district_name: string;
  postal_code: string | null;
  created_at: Date;
  updated_at: Date | null;
};
