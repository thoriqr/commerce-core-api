export type InputWarehouse = {
  name: string;
  provinceId: number;
  provinceName: string;
  cityId: number;
  cityName: string;
};

export type WarehousesRow = {
  id: number;
  name: string;
  shipping_city_id: number;
  shipping_city_name: string;
  shipping_province_id: number;
  shipping_province_name: string;
  created_at: Date;
  updated_at: Date | null;
};
