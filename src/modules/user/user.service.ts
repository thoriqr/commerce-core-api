import { TransactionManager } from "@/infra/db/transaction-manager";
import { UserRepo } from "./user.repo";
import { UpdateProfileInput, UpsertAddressInput } from "./user.schema";
import { ShippingService } from "../shipping/shipping.service";
import { AppError } from "@/errors/app-error";
import { MAX_USER_ADDRESSES } from "./user.constants";
import { mapUserAddresses } from "./user.mapper";
import { AuthContext } from "../auth/auth.types";

export class UserService {
  constructor(
    private tm: TransactionManager,
    private readonly userRepo: UserRepo,
    private readonly shippingService: ShippingService
  ) {}

  getAddresses = async (userId: number) => {
    const rows = await this.userRepo.getUserAddresses(userId);
    const dto = mapUserAddresses(rows);
    return { addresses: dto, limit: MAX_USER_ADDRESSES };
  };

  getAddressDetail = async (userId: number, addressId: number) => {
    const address = await this.userRepo.getAddressDetail(userId, addressId);

    if (!address) {
      throw AppError.notFound("Address not found");
    }

    return {
      recipientName: address.recipient_name,
      label: address.label ?? "",
      phone: address.phone,
      addressLine: address.address_line,
      postalCode: address.postal_code ?? "",
      shippingProvinceId: String(address.shipping_province_id),
      shippingCityId: String(address.shipping_city_id),
      shippingDistrictId: String(address.shipping_district_id),
      isDefault: address.isDefault
    };
  };

  createAddress = async (userId: number, input: UpsertAddressInput) => {
    const addressCount = await this.userRepo.countUserAddresses(userId);

    if (addressCount >= MAX_USER_ADDRESSES) {
      throw AppError.badRequest(`Maximum ${MAX_USER_ADDRESSES} addresses allowed`);
    }

    const provinces = await this.shippingService.getProvinces();
    const province = provinces.find((p) => p.id === input.shippingProvinceId);

    if (!province) {
      throw AppError.badRequest("Invalid province");
    }

    const cities = await this.shippingService.getCities(input.shippingProvinceId);
    const city = cities.find((c) => c.id === input.shippingCityId);

    if (!city) {
      throw AppError.badRequest("Invalid city");
    }

    const districts = await this.shippingService.getDistricts(input.shippingCityId);
    const district = districts.find((d) => d.id === input.shippingDistrictId);

    if (!district) {
      throw AppError.badRequest("Invalid district");
    }

    const existingAddress = await this.userRepo.getUserAddress(userId);

    let isDefault: boolean = input.isDefault ?? false;

    if (!existingAddress) {
      isDefault = true;
    }

    await this.tm.transaction(async (trx) => {
      if (isDefault) {
        await this.userRepo.clearDefaultAddress(userId, trx);
      }

      await this.userRepo.createAddress(
        {
          userId,
          label: input.label ?? null,
          recipientName: input.recipientName,
          phone: input.phone,
          addressLine: input.addressLine,
          provinceName: province.name,
          cityName: city.name,
          districtName: district.name,
          postalCode: input.postalCode ?? null,
          shippingProvinceId: province.id,
          shippingCityId: city.id,
          shippingDistrictId: district.id,
          isDefault
        },
        trx
      );
    });
  };

  updateAddress = async (userId: number, addressId: number, input: UpsertAddressInput) => {
    // check address ownership
    const address = await this.userRepo.getAddressById(userId, addressId);

    if (!address) {
      throw AppError.notFound("Address not found");
    }

    // validate province
    const provinces = await this.shippingService.getProvinces();
    const province = provinces.find((p) => p.id === input.shippingProvinceId);

    if (!province) {
      throw AppError.badRequest("Invalid province");
    }

    // validate city
    const cities = await this.shippingService.getCities(input.shippingProvinceId);
    const city = cities.find((c) => c.id === input.shippingCityId);

    if (!city) {
      throw AppError.badRequest("Invalid city");
    }

    // validate district
    const districts = await this.shippingService.getDistricts(input.shippingCityId);
    const district = districts.find((d) => d.id === input.shippingDistrictId);

    if (!district) {
      throw AppError.badRequest("Invalid district");
    }

    await this.tm.transaction(async (trx) => {
      await this.userRepo.updateAddress(
        {
          addressId,
          userId,

          label: input.label ?? null,
          recipientName: input.recipientName,
          phone: input.phone,
          addressLine: input.addressLine,

          provinceName: province.name,
          cityName: city.name,
          districtName: district.name,
          postalCode: input.postalCode ?? null,
          shippingProvinceId: province.id,
          shippingCityId: city.id,
          shippingDistrictId: district.id
        },
        trx
      );
    });
  };

  updateProfile = async (user: AuthContext, input: UpdateProfileInput) => {
    if (user.isDemo) {
      throw AppError.forbidden("Demo account cannot update profile");
    }

    await this.userRepo.updateProfile(user.id, input);
  };

  getUserProfile = async (userId: number) => {
    const row = await this.userRepo.getUserProfile(userId);

    if (!row) {
      throw AppError.unauthorized();
    }

    const providers = row.providers
      ? row.providers.map((r) => ({
          provider: r.provider,
          providerEmail: r.provider_email ?? "",
          providerDisplayName: r.provider_display_name ?? "",
          providerAvatarUrl: r.provider_avatar_url ?? ""
        }))
      : [];

    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      status: row.status,

      hasPassword: row.has_password,

      defaultAddress: row.address_id
        ? {
            id: row.address_id,
            label: row.label ?? "",
            recipientName: row.recipient_name ?? "",
            phone: row.phone ?? "",
            addressLine: row.address_line ?? "",
            cityName: row.city_name ?? "",
            provinceName: row.province_name ?? "",
            districtName: row.district_name ?? "",
            postalCode: row.postal_code ?? ""
          }
        : null,

      providers
    };
  };

  setDefaultAddress = async (userId: number, addressId: number) => {
    const address = await this.userRepo.getAddressById(userId, addressId);

    if (!address) {
      throw AppError.notFound("Address not found");
    }

    await this.tm.transaction(async (trx) => {
      await this.userRepo.clearDefaultAddress(userId, trx);

      await this.userRepo.setDefaultAddress(userId, addressId, trx);
    });
  };

  deleteAddress = async (userId: number, addressId: number) => {
    const address = await this.userRepo.getAddressById(userId, addressId);

    if (!address) {
      throw AppError.notFound("Address not found");
    }

    await this.tm.transaction(async (trx) => {
      await this.userRepo.deleteAddress(userId, addressId, trx);

      if (address.is_default) {
        const anotherAddress = await this.userRepo.getAnotherAddress(userId, addressId, trx);

        if (anotherAddress) {
          await this.userRepo.setDefaultAddress(userId, anotherAddress.id, trx);
        }
      }
    });
  };
}
