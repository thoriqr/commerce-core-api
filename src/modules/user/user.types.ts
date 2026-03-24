export type UserProfileRow = {
  id: number;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
  has_password: boolean;

  address_id: number | null;
  recipient_name: string | null;
  phone: string | null;
  address_line: string | null;
  city_name: string | null;
  province_name: string | null;
  postal_code: string | null;

  providers: Array<{
    provider: string;
    provider_email: string | null;
    provider_display_name: string | null;
    provider_avatar_url: string | null;
  }> | null;
};
