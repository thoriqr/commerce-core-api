export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "***";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function maskName(name: string) {
  if (!name) return "***";

  const [first, ...rest] = name.trim().split(/\s+/);

  const safeFirst = first ?? "";
  const maskedFirst = safeFirst.length <= 2 ? `${safeFirst[0] ?? ""}*` : `${safeFirst.slice(0, 2)}***`;

  return rest.length > 0 ? `${maskedFirst} ${rest.map(() => "***").join(" ")}` : maskedFirst;
}

export function maskPhone(phone: string) {
  if (phone.length <= 4) {
    return "***";
  }

  return `${phone.slice(0, 2)}${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-2)}`;
}

export function maskAddress(address: string) {
  if (address.length <= 4) {
    return "***";
  }

  return `${address.slice(0, 3)}***`;
}

export function maskPostalCode(postalCode: string) {
  if (postalCode.length <= 2) {
    return "***";
  }

  return `${postalCode.slice(0, 2)}***`;
}
