import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, BarChart3, Shield, Sun, Moon } from 'lucide-react';

const Sidebar = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/emergencies', icon: <AlertCircle size={20} />, label: 'Emergencies' },
        { path: '/users', icon: <Users size={20} />, label: 'Users' },
        { path: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-primary text-white p-6 shadow-2xl z-50 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="bg-white p-2 rounded-lg">
                    <Shield className="text-primary" size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">CareLine360</h1>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
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
