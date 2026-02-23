import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, BarChart3, Shield, Sun, Moon, LogOut, Video } from 'lucide-react';


import { getFullName, clearAuth } from '../auth/authStorage';

const Sidebar = () => {
    const [isDark, setIsDark] = useState(false);
    const fullName = getFullName();
    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    let menuItems = [];
    if (role === "responder") {
        menuItems = [
            { path: '/admin/dashboard/emergencies', icon: <AlertCircle size={20} />, label: 'Emergencies' },
        ];
    } else {
        menuItems = [
            { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { path: '/admin/dashboard/emergencies', icon: <AlertCircle size={20} />, label: 'Emergencies' },
            { path: '/admin/dashboard/users', icon: <Users size={20} />, label: 'Users' },
            { path: '/admin/dashboard/meet-assign', icon: <Video size={20} />, label: 'Meet Assign' },
            { path: '/admin/dashboard/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
        ];
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-primary text-white p-6 shadow-2xl z-50 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="bg-white p-2 rounded-lg">
                    <Shield className="text-primary" size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">CareLine360</h1>
            </div>

            <div className="mb-8 px-2">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold mb-1">Logged in as</p>
                <p className="text-sm font-bold truncate">{fullName || 'Admin User'}</p>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin/dashboard'}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="absolute bottom-8 left-6 right-6 space-y-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 bg-red-500/10 text-red-100 rounded-2xl backdrop-blur-sm hover:bg-red-500/20 transition-all group border border-red-500/10"
                >
                    <span className="text-sm font-medium">Logout</span>
                    <LogOut size={18} className="text-red-300" />
                </button>

                <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/20 transition-all group"
                >
                    <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    {isDark ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-blue-100" />}
                </button>

                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-xs text-blue-100 font-medium uppercase tracking-widest">Version</p>
                    <p className="text-sm font-bold">1.0.0-PRO</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
