"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">Ошибка</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Что-то пошло не так
        </h2>
        <p className="text-gray-500 mb-8">
          Произошла непредвиденная ошибка. Попробуйте ещё раз.
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  )
}
