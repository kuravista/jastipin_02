/**
 * Analytics API Client
 * Handles fetching dashboard analytics and alerts
 */

import { apiGet } from '../api-client'

export interface MonthlyAnalytics {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersGrowth: number
  totalParticipants: number
  participantsGrowth: number
}

export interface LowStockProduct {
  id: string
  title: string
  stock: number
  tripTitle: string
}

export interface DashboardAlerts {
  pendingValidationCount: number
  lowStockProductsCount: number
  lowStockProducts: LowStockProduct[]
}

export interface DashboardData {
  analytics: MonthlyAnalytics
  alerts: DashboardAlerts
}

export interface AnalyticsResponse {
  success: boolean
  data: DashboardData
}

/**
 * Fetch complete dashboard data (analytics + alerts)
 */
export async function fetchDashboardAnalytics(): Promise<DashboardData> {
  const response = await apiGet<AnalyticsResponse>('/analytics/dashboard')
  return response.data
}

/**
 * Fetch monthly analytics only
 */
export async function fetchMonthlyAnalytics(): Promise<MonthlyAnalytics> {
  const response = await apiGet<{ success: boolean; data: MonthlyAnalytics }>(
    '/analytics/monthly'
  )
  return response.data
}

/**
 * Fetch dashboard alerts only
 */
export async function fetchDashboardAlerts(): Promise<DashboardAlerts> {
  const response = await apiGet<{ success: boolean; data: DashboardAlerts }>(
    '/analytics/alerts'
  )
  return response.data
}
