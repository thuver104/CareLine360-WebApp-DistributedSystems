import { useState, useEffect } from 'react';
import { Users, AlertCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, icon, color, delay }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`} style={{ animationDelay: `${delay}ms` }}>
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data.data);
        } catch (error) {
            toast.error('Failed to load dashboard stats');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="text-slate-500 font-medium animate-pulse">Initializing Dashboard...</p>
        </div>
    );

    if (!stats) return <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl font-bold">Failed to synchronize with medical database. Please verify connection.</div>;

    const chartData = {
        labels: ['Pending', 'Dispatched', 'Arrived', 'Resolved'],
        datasets: [
            {
                data: [
                    stats.emergencyStatusBreakdown.PENDING,
                    stats.emergencyStatusBreakdown.DISPATCHED,
                    stats.emergencyStatusBreakdown.ARRIVED,
                    stats.emergencyStatusBreakdown.RESOLVED,
                ],
                backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">System telemetry and active responder network status</p>
                </div>
                <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-500 select-none">
                    Status: <span className="text-teal-500">Online & Synchronized</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Members"
                    value={stats.totalUsers}
                    icon={<Users size={24} className="text-blue-600 dark:text-blue-400" />}
                    color="bg-blue-600"
                    delay={0}
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.totalEmergencies - stats.resolvedEmergencies}
                    icon={<AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />}
                    color="bg-amber-600"
                    delay={100}
                />
                <StatCard
                    title="Avg Response"
                    value={`${stats.avgResponseTime} min`}
                    icon={<Clock size={24} className="text-indigo-600 dark:text-indigo-400" />}
                    color="bg-indigo-600"
                    delay={200}
                />
                <StatCard
                    title="Resolved Cases"
                    value={stats.resolvedEmergencies}
                    icon={<CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />}
                    color="bg-emerald-600"
                    delay={300}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-8 uppercase tracking-widest border-l-4 border-teal-500 pl-3">Emergency Matrix</h3>
                    <div className="aspect-square relative flex items-center justify-center">
                        <Pie
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            font: { size: 11, weight: '600' },
                                            color: '#64748b'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-8 uppercase tracking-widest border-l-4 border-teal-500 pl-3">Performance Analytics</h3>
                    <div className="space-y-6">
                        <div className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-teal-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Resolution Efficiency</p>
                                    <p className="text-xs text-slate-500">Historical case closure velocity</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-slate-900 dark:text-white">{Math.round((stats.resolvedEmergencies / stats.totalEmergencies) * 100) || 0}%</p>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Optimal</p>
                            </div>
                        </div>

                        <div className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-blue-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Dispatch Stability</p>
                                    <p className="text-xs text-slate-500">Network responder availability</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-slate-900 dark:text-white">High</p>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Stable</p>
                            </div>
                        </div>

                        <div className="p-6 bg-teal-50 dark:bg-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-900/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <TrendingUp size={80} className="text-teal-600" />
                            </div>
                            <div className="relative">
                                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 mb-2">
                                    <TrendingUp size={18} strokeWidth={3} />
                                    <span className="font-bold uppercase text-xs tracking-widest text-left">Strategic Insight</span>
                                </div>
                                <p className="text-sm text-teal-800/80 dark:text-teal-400/80 leading-relaxed font-medium text-left">
                                    System performance metrics indicate high throughput with <span className="font-bold text-teal-900 dark:text-teal-200">95% service availability</span>. Response delta remains within acceptable surgical limits for the current demographic load.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
