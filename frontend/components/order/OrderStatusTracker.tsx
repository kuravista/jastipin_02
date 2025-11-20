'use client'

import { CheckCircle, Circle, Clock, Package, Truck, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OrderStatus {
  status: 
    | 'pending_dp'
    | 'awaiting_validation'
    | 'awaiting_payment'
    | 'confirmed'
    | 'shipped'
    | 'completed'
    | 'cancelled'
    | 'rejected'
  dpPaidAt?: Date | null
  validatedAt?: Date | null
  finalPaidAt?: Date | null
  shippedAt?: Date | null
  completedAt?: Date | null
  rejectionReason?: string | null
}

interface OrderStatusTrackerProps {
  order: OrderStatus
}

interface Step {
  id: string
  label: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending' | 'skipped'
  timestamp?: Date | null
  description?: string
}

export default function OrderStatusTracker({ order }: OrderStatusTrackerProps) {
  const getSteps = (): Step[] => {
    const baseSteps = [
      {
        id: 'dp_payment',
        label: 'Pembayaran DP',
        icon: <Circle className="h-5 w-5" />,
        status: order.dpPaidAt ? 'completed' : 'pending' as const,
        timestamp: order.dpPaidAt,
        description: order.dpPaidAt ? 'DP telah dibayar' : 'Menunggu pembayaran DP'
      },
      {
        id: 'validation',
        label: 'Validasi Jastiper',
        icon: <Clock className="h-5 w-5" />,
        status: 
          order.validatedAt ? 'completed' :
          order.status === 'awaiting_validation' ? 'current' :
          order.dpPaidAt ? 'current' : 'pending' as const,
        timestamp: order.validatedAt,
        description: 
          order.validatedAt ? 'Pesanan telah divalidasi' :
          order.status === 'awaiting_validation' ? 'Jastiper sedang memvalidasi pesanan' :
          'Menunggu validasi jastiper'
      },
      {
        id: 'final_payment',
        label: 'Pembayaran Akhir',
        icon: <Package className="h-5 w-5" />,
        status: 
          order.finalPaidAt ? 'completed' :
          order.status === 'awaiting_payment' ? 'current' : 'pending' as const,
        timestamp: order.finalPaidAt,
        description: 
          order.finalPaidAt ? 'Pembayaran akhir selesai' :
          order.status === 'awaiting_payment' ? 'Menunggu pembayaran sisa' :
          'Menunggu pembayaran akhir'
      },
      {
        id: 'confirmed',
        label: 'Dikonfirmasi',
        icon: <CheckCircle className="h-5 w-5" />,
        status: 
          ['confirmed', 'shipped', 'completed'].includes(order.status) ? 'completed' : 'pending' as const,
        timestamp: order.finalPaidAt,
        description: 
          ['confirmed', 'shipped', 'completed'].includes(order.status) ? 
          'Pesanan dikonfirmasi jastiper' : 
          'Menunggu konfirmasi'
      },
      {
        id: 'shipped',
        label: 'Dikirim',
        icon: <Truck className="h-5 w-5" />,
        status: 
          order.shippedAt ? 'completed' :
          order.status === 'shipped' ? 'current' : 'pending' as const,
        timestamp: order.shippedAt,
        description: 
          order.shippedAt ? 'Pesanan sedang dalam pengiriman' :
          order.status === 'shipped' ? 'Dalam pengiriman' :
          'Menunggu pengiriman'
      },
      {
        id: 'completed',
        label: 'Selesai',
        icon: <CheckCircle className="h-5 w-5" />,
        status: order.status === 'completed' ? 'completed' : 'pending' as const,
        timestamp: order.completedAt,
        description: order.status === 'completed' ? 'Pesanan selesai' : 'Menunggu penyelesaian'
      }
    ]

    // Handle rejected/cancelled orders
    if (order.status === 'rejected' || order.status === 'cancelled') {
      return [
        ...baseSteps.slice(0, 2),
        {
          id: 'rejected',
          label: order.status === 'rejected' ? 'Ditolak' : 'Dibatalkan',
          icon: <XCircle className="h-5 w-5" />,
          status: 'completed' as const,
          timestamp: order.validatedAt || new Date(),
          description: order.rejectionReason || 
            (order.status === 'rejected' ? 'Pesanan ditolak jastiper' : 'Pesanan dibatalkan')
        },
        ...baseSteps.slice(2).map(step => ({ ...step, status: 'skipped' as const }))
      ]
    }

    return baseSteps
  }

  const steps = getSteps()
  const currentStepIndex = steps.findIndex(step => step.status === 'current')

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending_dp':
        return <Badge variant="secondary">Menunggu DP</Badge>
      case 'awaiting_validation':
        return <Badge variant="default">Menunggu Validasi</Badge>
      case 'awaiting_payment':
        return <Badge variant="default">Menunggu Pembayaran</Badge>
      case 'confirmed':
        return <Badge variant="default">Dikonfirmasi</Badge>
      case 'shipped':
        return <Badge variant="default">Dalam Pengiriman</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Selesai</Badge>
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{order.status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Status Pesanan</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed'
            const isCurrent = step.status === 'current'
            const isPending = step.status === 'pending'
            const isSkipped = step.status === 'skipped'
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div 
                    className={`absolute left-5 top-10 w-0.5 h-full ${
                      isCompleted ? 'bg-green-600' :
                      isSkipped ? 'bg-gray-300' :
                      'bg-gray-300'
                    }`}
                  />
                )}

                {/* Step Content */}
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`
                    relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                    ${isCompleted ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-blue-600 text-white' :
                      isSkipped ? 'bg-gray-300 text-gray-500' :
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> :
                     step.id === 'rejected' ? <XCircle className="h-5 w-5" /> :
                     step.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${
                      isCompleted ? 'text-green-600' :
                      isCurrent ? 'text-blue-600' :
                      isSkipped ? 'text-gray-400 line-through' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(step.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Info for Current Step */}
        {currentStepIndex >= 0 && steps[currentStepIndex].status === 'current' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Status saat ini:</strong> {steps[currentStepIndex].description}
            </p>
          </div>
        )}

        {/* Rejection/Cancellation Reason */}
        {(order.status === 'rejected' || order.status === 'cancelled') && order.rejectionReason && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Alasan:</strong> {order.rejectionReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
