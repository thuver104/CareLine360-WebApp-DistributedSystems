import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalyticsCard = ({ title, children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm ${className}`}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-8 uppercase tracking-widest border-l-4 border-teal-500 pl-3">{title}</h3>
        {children}
    </div>
);

const Analytics = () => {
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
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="text-slate-500 font-medium animate-pulse">Analyzing System Data...</p>
        </div>
    );

    if (!stats) return <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl font-bold">Failed to load analytics engine.</div>;

    const roleData = {
        labels: ['Patients', 'Doctors', 'Responders'],
        datasets: [{
            label: 'Users by Role',
            data: [stats.totalPatients, stats.totalDoctors, stats.totalResponders],
            backgroundColor: ['#14b8a6', '#3b82f6', '#8b5cf6'],
            borderColor: 'transparent',
            hoverOffset: 15,
        }]
    };

    const responseTimeData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Avg Response Time (min)',
            data: [35, 32, 28, 30, 25, stats.avgResponseTime],
            fill: true,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            tension: 0.4,
            pointBackgroundColor: '#0d9488',
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Advanced intelligence metrics and responder demographic distribution</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsCard title="User Demographics">
                    <div className="h-72 flex justify-center relative">
                        <Doughnut
                            data={roleData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            font: { size: 12, weight: '600' },
                                            color: '#64748b'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </AnalyticsCard>

                <AnalyticsCard title="Response Velocity Trend">
                    <div className="h-72">
                        <Line
                            data={responseTimeData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                                    },
                                    x: {
                                        grid: { display: false }
                                    }
                                }
                            }}
                        />
                    </div>
                </AnalyticsCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 rounded-2xl text-white shadow-lg lg:col-span-1 border border-teal-500/20 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
                        <Activity size={200} />
                    </div>
                    <p className="text-teal-100 font-bold uppercase text-[10px] tracking-widest mb-2">Core Health Status</p>
                    <h4 className="text-4xl font-black mb-10">Optimal</h4>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="uppercase tracking-widest text-teal-100/80">Resource Saturation</span>
                                <span>42%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: '42%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="uppercase tracking-widest text-teal-100/80">Operational Uptime</span>
                                <span>99.9%</span>
                            </div>
                            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: '99.9%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnalyticsCard title="Critical Performance Indices" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-teal-500/20">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Network Conversion</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900 dark:text-white">12.4%</p>
                                <span className="text-xs font-bold text-teal-500 mb-1">+2.1% ↑</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-teal-500/20">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Daily Active Sessions</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900 dark:text-white">842</p>
                                <span className="text-xs font-bold text-teal-500 mb-1">+4% ↑</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-teal-500/20">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Medical Retention</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900 dark:text-white">94%</p>
                                <span className="text-xs font-bold text-slate-500 mb-1">Stable</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:border-teal-500/20">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Internal API Latency</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900 dark:text-white">45ms</p>
                                <span className="text-xs font-bold text-teal-500 mb-1">Optimal</span>
                            </div>
                        </div>
                    </div>
                </AnalyticsCard>
            </div>
        </div>
    );
};

export default Analytics;
