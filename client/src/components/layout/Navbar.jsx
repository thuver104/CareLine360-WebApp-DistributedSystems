import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { displayName } from "../../utils/displayName";

const navLinks = [
  { path: "/appointments/book", label: "Book", icon: "M12 4v16m8-8H4" },
  { path: "/appointments", label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { path: "/appointments/history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function Navbar() {
  const { users, currentUser, setCurrentUser } = useUser();
  const location = useLocation();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                CareLine360
              </span>
            </Link>
            <div className="hidden sm:flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                  </svg>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                currentUser.role === "doctor"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              }`}>
                {currentUser.role}
              </span>
            )}
            <select
              value={currentUser?._id || ""}
              onChange={(e) => {
                const user = users.find((u) => u._id === e.target.value);
                setCurrentUser(user);
              }}
              className="block w-48 text-sm border border-gray-200 rounded-lg bg-gray-50/50 py-1.5 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {displayName(user)} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:hidden flex space-x-1 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
              </svg>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
