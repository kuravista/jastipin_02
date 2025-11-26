/**
 * Jastiper Validation Dashboard
 * Main component for order validation management
 * Now modularized into smaller, focused components
 */

'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import {
  OrderHeader,
  OrderFilters,
  OrderEmptyState,
  OrderCard,
  OrderPagination,
  ShippingCalculatorDialog,
  ProofPreviewDialog,
  useOrderManagement
} from './validasi'

export default function JastiperValidationDashboard() {
  const {
    orders,
    loading,
    processing,
    exporting,
    error,
    expandedOrderId,
    activeFilter,
    searchQuery,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    formState,
    shippingOptions,
    calculatingShipping,
    showCalculator,
    showProofPreview,
    selectedProofUrl,
    selectedProofType,
    setActiveFilter,
    setSearchQuery,
    setShowCalculator,
    toggleExpand,
    updateFormField,
    calculateShipping,
    calculateMedianShipping,
    selectShippingOption,
    handleValidate,
    handleApproveFinal,
    handleExportExcel,
    handleExportLabels,
    fetchOrders,
    openProofPreview,
    closeProofPreview
  } = useOrderManagement()

  const pendingCount = orders.filter(o => o.status === 'awaiting_validation').length

  return (
    <div className="space-y-4">
      {/* Header with export dropdown */}
      <OrderHeader
        exporting={exporting}
        loading={loading}
        onExportExcel={handleExportExcel}
        onExportLabels={handleExportLabels}
      />

      {/* Search & Filter */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        pendingCount={pendingCount}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Order List Container */}
      <div className="relative min-h-[300px]">
        {/* Loading or Empty State */}
        {(loading || orders.length === 0) && (
          <OrderEmptyState loading={loading} hasSearchQuery={!!searchQuery} />
        )}

        {/* Order List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                onToggle={() => toggleExpand(order.id)}
                formState={formState}
                onUpdateFormField={updateFormField}
                processing={processing}
                calculatingShipping={calculatingShipping}
                shippingOptionsAvailable={shippingOptions.length > 0}
                onValidate={handleValidate}
                onApproveFinal={handleApproveFinal}
                onCalculateShipping={calculateShipping}
                onCalculateMedian={calculateMedianShipping}
                onOpenProof={openProofPreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <OrderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        loading={loading}
        onPageChange={fetchOrders}
      />

      {/* Dialogs */}
      <ShippingCalculatorDialog
        open={showCalculator}
        onOpenChange={setShowCalculator}
        options={shippingOptions}
        onSelect={selectShippingOption}
      />

      <ProofPreviewDialog
        open={showProofPreview}
        onOpenChange={closeProofPreview}
        proofUrl={selectedProofUrl}
        proofType={selectedProofType}
      />
    </div>
  )
}
