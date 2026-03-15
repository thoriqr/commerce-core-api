import { UserAddressDTO } from "./user.dto";
import { UserAddressRow } from "./user.repo.types";

export function mapUserAddresses(rows: UserAddressRow[]): UserAddressDTO[] {
  return rows.map((r) => ({
    id: r.id,
    label: r.label ?? "",
    recipientName: r.recipient_name,
    phone: r.phone,
    addressLine: r.address_line,
    provinceName: r.province_name,
    cityName: r.city_name,
    districtName: r.district_name ?? "",
    postalCode: r.postal_code ?? "",
    isDefault: r.is_default
  }));
}
