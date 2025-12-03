/**
 * Loading state for product detail page
 */
export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-violet-50">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Image Skeleton */}
        <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />

        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Badges Skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 pt-4 border-t">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Trip Info Skeleton */}
        <div className="pt-4 border-t">
          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Button Skeleton */}
        <div className="pt-4 border-t">
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
