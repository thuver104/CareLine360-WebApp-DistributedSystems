export default function Footer() {
  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span>CareLine360 — Health Helpline for Remote Consultation</span>
        </div>
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} CareLine360</p>
      </div>
    </footer>
  );
}
