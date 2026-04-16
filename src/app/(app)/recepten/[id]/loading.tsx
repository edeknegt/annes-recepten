export default function RecipeDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="pt-4 sm:pt-6 lg:pt-8 pb-4">
        {/* Back link */}
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />

        {/* Title */}
        <div className="h-8 w-3/4 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-1/2 bg-gray-200 rounded mb-3" />

        {/* Badges */}
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-24 bg-honey-200 rounded-full" />
          <div className="h-6 w-20 bg-amber-100 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="h-6 w-24 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="h-6 w-28 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${65 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5">
          <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-honey-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
