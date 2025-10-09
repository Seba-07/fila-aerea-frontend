export default function Loading() {
  return (
    <div className="min-h-screen theme-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </div>
        <p className="theme-text-primary text-lg font-medium">Cargando...</p>
      </div>
    </div>
  );
}
