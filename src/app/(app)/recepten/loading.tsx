export default function RecipesLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="pt-4 sm:pt-6 lg:pt-8 pb-4">
        <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
        {/* Search bar + filter button */}
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-white rounded-xl border border-gray-200" />
          <div className="w-12 h-12 bg-white rounded-xl border border-gray-200" />
        </div>
      </div>

      {/* Recipe grid skeleton */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-honey-200" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-6 w-20 bg-honey-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
