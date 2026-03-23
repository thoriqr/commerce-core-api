export function fillMissingDays(data: { date: string; orders: number }[], from: Date, to: Date) {
  const map = new Map(data.map((d) => [d.date, d.orders]));

  const result: { date: string; orders: number }[] = [];

  const current = new Date(from);

  while (current < to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    const dateStr = `${year}-${month}-${day}`;

    result.push({
      date: dateStr,
      orders: map.get(dateStr) ?? 0
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function fillMissingMonths(data: { month: string; revenue: number }[], from: Date, to: Date) {
  const map = new Map(data.map((d) => [d.month, d.revenue]));

  const result: { month: string; revenue: number }[] = [];

  const current = new Date(from);

  current.setDate(1); // start from first day of month

  while (current < to) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");

    const monthStr = `${year}-${month}`;

    result.push({
      month: monthStr,
      revenue: map.get(monthStr) ?? 0
    });

    current.setMonth(current.getMonth() + 1);
  }

  return result;
}
