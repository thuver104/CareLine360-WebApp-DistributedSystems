export default function LoadingSpinner() {
  return (
    <div className="flex flex-col justify-center items-center py-16">
      <div className="w-10 h-10 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-400">Loading...</p>
    </div>
  );
}
