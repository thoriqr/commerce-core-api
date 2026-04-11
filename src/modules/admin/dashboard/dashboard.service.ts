import { mapAdminOrderStatus } from "../order/order.mapper";
import { DashboardRepo } from "./dashboard.repo";
import { GetDashboardInput } from "./dashboard.schema";
import { fillMissingDays, fillMissingMonths } from "./dashboard.uitl";

export class DashboardService {
  constructor(private readonly repo: DashboardRepo) {}

  getDashboard = async (input: GetDashboardInput) => {
    const now = new Date();

    const from = input.from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const to = input.to ?? now;

    const [summary, revenueRows, orderRows, bestSelling, recentOrders] = await Promise.all([
      this.repo.getSummary(from, to),
      this.repo.getRevenueChart(from, to),
      this.repo.getOrdersChart(from, to),
      this.repo.getBestSelling(5),
      this.repo.getRecentOrders(5)
    ]);

    // mapping first to number
    const revenueChartRaw = revenueRows.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue)
    }));

    const ordersChartRaw = orderRows.map((r) => ({
      date: r.date,
      orders: r.orders
    }));

    // fill missing
    const revenueChart = fillMissingMonths(revenueChartRaw, from, to);
    const ordersChart = fillMissingDays(ordersChartRaw, from, to);

    return {
      summary: {
        totalOrders: summary.total_orders,
        totalRevenue: Number(summary.total_revenue)
      },

      revenueChart,
      ordersChart,

      bestSelling: bestSelling.map((r) => ({
        id: r.id,
        name: r.name,
        sold: r.sold
      })),

      recentOrders: recentOrders.map((r) => ({
        orderCode: r.order_code,
        total: Number(r.total),
        status: mapAdminOrderStatus({
          status: r.status,
          payment_status: r.payment_status,
          shipment_status: r.shipment_status
        }),
        rawStatus: r.status,
        paymentStatus: r.payment_status,
        shipmentStatus: r.shipment_status,
        createdAt: r.created_at,
        recipientName: r.recipient_name
      }))
    };
  };
}
