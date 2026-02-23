import { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
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
    <div className={`glass-card p-6 ${className}`}>
        <h3 className="text-lg font-bold text-slate-900 mb-6">{title}</h3>
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

    if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;

    const roleData = {
        labels: ['Patients', 'Doctors', 'Responders'],
        datasets: [{
            label: 'Users by Role',
            data: [stats.totalPatients, stats.totalDoctors, stats.totalResponders],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
            borderColor: 'white',
            borderWidth: 2,
        }]
    };

    const responseTimeData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Avg Response Time (min)',
            data: [35, 32, 28, 30, 25, stats.avgResponseTime],
            fill: true,
            borderColor: '#0077b6',
            backgroundColor: 'rgba(0, 119, 182, 0.1)',
            tension: 0.4,
        }]
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics</h2>
                <p className="text-slate-500">Deep insights into system performance and user demographics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnalyticsCard title="User Demographics (Role Distribution)">
                    <div className="h-64 flex justify-center">
                        <Doughnut data={roleData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </AnalyticsCard>

                <AnalyticsCard title="Response Time Trend (Last 6 Months)">
                    <div className="h-64">
                        <Line data={responseTimeData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                    </div>
                </AnalyticsCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass-card p-6 bg-primary text-white lg:col-span-1">
                    <p className="text-blue-100 font-medium">System Health</p>
                    <h4 className="text-3xl font-bold mt-2">Optimal</h4>
                    <div className="mt-8 space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Resource Usage</span>
                                <span>42%</span>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{ width: '42%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Uptime</span>
                                <span>99.9%</span>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full" style={{ width: '99.9%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <AnalyticsCard title="Key Performance Indicators" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion rate</p>
                            <p className="text-xl font-bold mt-1">12.4%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Sessions</p>
                            <p className="text-xl font-bold mt-1">842</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retention</p>
                            <p className="text-xl font-bold mt-1">94%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Latency</p>
                            <p className="text-xl font-bold mt-1">45ms</p>
                        </div>
                    </div>
                </AnalyticsCard>
            </div>
        </div>
    );
};

export default Analytics;
