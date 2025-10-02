export default function SkeletonCard() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-48 md:h-48 bg-gray-700"></div>
        <div className="md:w-2/3 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="h-7 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-700 rounded-full w-20"></div>
            <div className="h-6 bg-gray-700 rounded-full w-24"></div>
            <div className="h-6 bg-gray-700 rounded-full w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
