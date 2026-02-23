import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <Toaster position="top-right" />
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
