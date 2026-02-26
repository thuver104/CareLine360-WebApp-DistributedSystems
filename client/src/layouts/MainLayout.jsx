import { Outlet } from 'react-router-dom';
import AdminHeader from '../components/layout/AdminHeader';
import { Toaster } from 'react-hot-toast';

/**
 * MainLayout – Admin / Responder portal
 * Replaces the old fixed sidebar with a sticky top header.
 * Supports light/dark mode via html.dark class (ThemeContext).
 */
const MainLayout = () => {
    return (
        <div className="min-h-screen bg-[var(--bg-page)] transition-colors duration-300">
            <AdminHeader />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                        },
                    }}
                />
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
