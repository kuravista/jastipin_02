export function TopBar() {
  return (
    <div className="bg-pink-50 border-b border-pink-100 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 text-sm text-pink-900">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
            Demo
          </span>
          <span className="hidden sm:inline">—</span>
          <span className="text-center">Dipakai oleh 100+ jastiper aktif</span>
        </div>
      </div>
    </div>
  )
}
