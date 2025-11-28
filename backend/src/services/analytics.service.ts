import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MonthlyAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalParticipants: number;
  participantsGrowth: number;
}

export interface DashboardAlerts {
  pendingValidationCount: number;
  lowStockProductsCount: number;
  lowStockProducts: Array<{
    id: string;
    title: string;
    stock: number;
    tripTitle: string;
  }>;
}

export class AnalyticsService {
  /**
   * Get analytics data for the current month for a specific jastiper
   */
  async getMonthlyAnalytics(jastiperId: string): Promise<MonthlyAnalytics> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get all trips for this jastiper
    const trips = await prisma.trip.findMany({
      where: { jastiperId },
      select: { id: true }
    });

    const tripIds = trips.map(t => t.id);

    if (tripIds.length === 0) {
      return {
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        totalParticipants: 0,
        participantsGrowth: 0
      };
    }

    // Current month revenue (only paid orders)
    const currentMonthRevenue = await prisma.order.aggregate({
      where: {
        tripId: { in: tripIds },
        createdAt: { gte: startOfCurrentMonth },
        status: {
          in: ['paid', 'processing', 'shipped', 'completed', 'dp_paid', 'pending_final']
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    // Last month revenue
    const lastMonthRevenue = await prisma.order.aggregate({
      where: {
        tripId: { in: tripIds },
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        status: {
          in: ['paid', 'processing', 'shipped', 'completed', 'dp_paid', 'pending_final']
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    // Current month orders
    const currentMonthOrders = await prisma.order.count({
      where: {
        tripId: { in: tripIds },
        createdAt: { gte: startOfCurrentMonth }
      }
    });

    // Last month orders
    const lastMonthOrders = await prisma.order.count({
      where: {
        tripId: { in: tripIds },
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    // Current month participants
    const currentMonthParticipants = await prisma.participant.count({
      where: {
        tripId: { in: tripIds },
        createdAt: { gte: startOfCurrentMonth }
      }
    });

    // Last month participants
    const lastMonthParticipants = await prisma.participant.count({
      where: {
        tripId: { in: tripIds },
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    // Calculate growth percentages
    const totalRevenue = currentMonthRevenue._sum.totalPrice || 0;
    const lastRevenue = lastMonthRevenue._sum.totalPrice || 0;
    const revenueGrowth = lastRevenue > 0
      ? ((totalRevenue - lastRevenue) / lastRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;

    const ordersGrowth = lastMonthOrders > 0
      ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
      : currentMonthOrders > 0 ? 100 : 0;

    const participantsGrowth = lastMonthParticipants > 0
      ? ((currentMonthParticipants - lastMonthParticipants) / lastMonthParticipants) * 100
      : currentMonthParticipants > 0 ? 100 : 0;

    return {
      totalRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
      totalOrders: currentMonthOrders,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
      totalParticipants: currentMonthParticipants,
      participantsGrowth: Math.round(participantsGrowth * 10) / 10
    };
  }

  /**
   * Get dashboard alerts for a specific jastiper
   */
  async getDashboardAlerts(jastiperId: string): Promise<DashboardAlerts> {
    // Get all trips for this jastiper
    const trips = await prisma.trip.findMany({
      where: { jastiperId },
      select: { id: true }
    });

    const tripIds = trips.map(t => t.id);

    if (tripIds.length === 0) {
      return {
        pendingValidationCount: 0,
        lowStockProductsCount: 0,
        lowStockProducts: []
      };
    }

    // Count orders pending validation
    const pendingValidationCount = await prisma.order.count({
      where: {
        tripId: { in: tripIds },
        status: { in: ['pending_dp_validation', 'pending_final_validation'] },
        validatedAt: null
      }
    });

    // Get low stock products (stock < 10 and not unlimited)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        tripId: { in: tripIds },
        isUnlimitedStock: false,
        stock: {
          not: null,
          lt: 10,
          gt: 0
        },
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        stock: true,
        Trip: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      },
      take: 10 // Limit to top 10 lowest stock
    });

    return {
      pendingValidationCount,
      lowStockProductsCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => ({
        id: p.id,
        title: p.title,
        stock: p.stock || 0,
        tripTitle: p.Trip.title
      }))
    };
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(jastiperId: string) {
    const [analytics, alerts] = await Promise.all([
      this.getMonthlyAnalytics(jastiperId),
      this.getDashboardAlerts(jastiperId)
    ]);

    return {
      analytics,
      alerts
    };
  }
}

export const analyticsService = new AnalyticsService();
