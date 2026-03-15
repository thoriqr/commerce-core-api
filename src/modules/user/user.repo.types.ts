export type CreateAddressRepoInput = {
  userId: number;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine: string;

  provinceName: string;
  cityName: string;
  districtName: string;

  shippingProvinceId: number;
  shippingCityId: number;
  shippingDistrictId: number;

  isDefault: boolean;
};

export type UpdateAddressRepoInput = {
  userId: number;
  addressId: number;
  label: string | null;
  recipientName: string;
  phone: string;
  addressLine: string;

  provinceName: string;
  cityName: string;
  districtName: string;

  shippingProvinceId: number;
  shippingCityId: number;
  shippingDistrictId: number;

  isDefault: boolean;
};

export type UserAddressRow = {
  id: number;
  label: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  province_name: string;
  city_name: string;
  district_name: string | null;
  postal_code: string | null;
  is_default: boolean;
};
