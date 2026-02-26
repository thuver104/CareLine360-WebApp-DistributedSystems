import { useState, useEffect } from 'react';
import { Users, AlertCircle, Clock, CheckCircle2, TrendingUp, Stethoscope, Activity, BarChart3 } from 'lucide-react';
import api from '../../api/axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, icon, color, delay }) => (
    <div className="group relative bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${delay}ms` }}>
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)] mt-0.5 tracking-tight">{value}</h3>
        </div>
        <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity ${color.replace('bg-', 'text-')}`}></div>
    </div>
);

const Dashboard = () => {
    const { isDark } = useTheme();
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
            <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-xs animate-pulse">Initializing Dashboard...</p>
        </div>
    );

    if (!stats) return <div className="p-8 text-center text-red-600 bg-red-500/10 border border-red-500/20 rounded-[24px] font-black uppercase tracking-widest text-xs">Failed to synchronize with medical database. Please verify connection.</div>;

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Admin Dashboard</h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">System telemetry and active responder network status</p>
                </div>
                <div className="px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                    <span className="text-[var(--text-secondary)]">Status:</span>
                    <span className="text-teal-600 dark:text-teal-400">Online & Synchronized</span>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 font-medium text-sm">Total Patients</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.totalPatients || 0}</h3>
                        </div>
                        <Users className="text-blue-200/50" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 font-medium text-sm">Active Doctors</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.totalDoctors || 0}</h3>
                        </div>
                        <Stethoscope className="text-green-200/50" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 font-medium text-sm">Total Emergencies</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.totalEmergencies || 0}</h3>
                        </div>
                        <Activity className="text-purple-200/50" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 font-medium text-sm">Avg Response</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.avgResponseTime || 0}min</h3>
                        </div>
                        <BarChart3 className="text-orange-200/50" size={32} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Emergency Matrix</h3>
                    </div>
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
                                            padding: 25,
                                            font: { size: 10, weight: '700', family: 'Outfit' },
                                            color: isDark ? '#94a3b8' : '#4b5563'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Performance Analytics</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="group flex items-center justify-between p-6 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border)] transition-all hover:border-teal-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Resolution Efficiency</p>
                                    <p className="text-xs text-[var(--text-muted)]">Historical case closure velocity</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-[var(--text-primary)]">{Math.round((stats.resolvedEmergencies / stats.totalEmergencies) * 100) || 0}%</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Optimal</p>
                            </div>
                        </div>

                        <div className="group flex items-center justify-between p-6 bg-[var(--bg-subtle)] rounded-2xl border border-[var(--border)] transition-all hover:border-blue-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Staffing Saturation</p>
                                    <p className="text-xs text-[var(--text-muted)]">Active responder density</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-[var(--text-primary)]">{(stats.activeResponders / (stats.totalResponders || 1) * 100).toFixed(0)}%</p>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Operational</p>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-teal-500/10 to-transparent rounded-2xl border border-teal-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                <TrendingUp size={80} className="text-teal-600" />
                            </div>
                            <div className="relative">
                                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 mb-2">
                                    <TrendingUp size={18} strokeWidth={3} />
                                    <span className="font-black uppercase text-[10px] tracking-[0.2em]">Strategic Insight</span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                                    System performance metrics indicate high throughput with <span className="font-bold text-[var(--text-primary)]">{stats.successRate}% emergency resolution</span>. The network currently supports <span className="font-bold text-[var(--text-primary)]">{stats.totalUsers} registered entities</span> across all medical tiers.
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
