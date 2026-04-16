export default function RecipesLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="loading-avatar w-20 h-20 rounded-2xl border-2 border-honey-300 shadow-sm">
        <img
          src="/erik-anne-drinks.png"
          alt=""
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <p className="mt-4 text-sm text-gray-400 font-medium">Laden...</p>
    </div>
  )
}
