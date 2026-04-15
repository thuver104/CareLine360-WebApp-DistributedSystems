import { useState, useEffect } from 'react';
import { Users, AlertCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ title, value, icon, color, delay }) => (
    <div className={`glass-card p-6 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`} style={{ animationDelay: `${delay}ms` }}>
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
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

    if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data. Please check if the server is running.</div>;

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
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500 mt-1">Real-time emergency monitoring system status</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<Users size={24} />}
                    color="bg-blue-500"
                    delay={0}
                />
                <StatCard
                    title="Active Emergencies"
                    value={stats.totalEmergencies - stats.resolvedEmergencies}
                    icon={<AlertCircle size={24} />}
                    color="bg-amber-500"
                    delay={100}
                />
                <StatCard
                    title="Avg Response Time"
                    value={`${stats.avgResponseTime} min`}
                    icon={<Clock size={24} />}
                    color="bg-indigo-500"
                    delay={200}
                />
                <StatCard
                    title="Resolved Cases"
                    value={stats.resolvedEmergencies}
                    icon={<CheckCircle2 size={24} />}
                    color="bg-emerald-500"
                    delay={300}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 glass-card p-8">
                    <h3 className="text-lg font-bold mb-6">Status Breakdown</h3>
                    <div className="aspect-square">
                        <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card p-8">
                    <h3 className="text-lg font-bold mb-6">Performance Insights</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <p className="font-medium">Resolution Rate</p>
                            </div>
                            <p className="font-bold">{Math.round((stats.resolvedEmergencies / stats.totalEmergencies) * 100) || 0}%</p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <p className="font-medium">Dispatch Efficiency</p>
                            </div>
                            <p className="font-bold">High</p>
                        </div>
                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <TrendingUp size={18} />
                                <span className="font-bold">Health Score</span>
                            </div>
                            <p className="text-sm text-slate-600">The system is operating at optimal capacity with average response times within target limits.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
