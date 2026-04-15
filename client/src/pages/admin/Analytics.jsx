import { useState, useEffect } from "react";
import { Activity, BarChart3, Users, Stethoscope } from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ReportGeneration from "../../components/dashboard/ReportGeneration";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const AnalyticsCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-[32px] shadow-sm ${className}`}
  >
    <h3 className="text-xs font-black text-[var(--text-primary)] mb-8 uppercase tracking-[0.25em] flex items-center gap-3">
      <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
      {title}
    </h3>
    {children}
  </div>
);

const Analytics = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data.data);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-transparent border-t-teal-600 relative z-10"></div>
        </div>
        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-xs animate-pulse">
          Analyzing Rescue Telemetry...
        </p>
      </div>
    );

  if (!stats)
    return (
      <div className="p-8 text-center text-red-600 bg-red-500/10 border border-red-500/20 rounded-[24px] font-black uppercase tracking-widest text-xs">
        Failed to load analytics engine.
      </div>
    );

  const roleData = {
    labels: ["Patients", "Doctors", "Responders"],
    datasets: [
      {
        label: "Users by Role",
        data: [stats.totalPatients, stats.totalDoctors, stats.totalResponders],
        backgroundColor: ["#14b8a6", "#3b82f6", "#8b5cf6"],
        borderColor: "transparent",
        hoverOffset: 15,
      },
    ],
  };

  const responseTimeData = {
    labels: stats.monthlyHistory.map((m) => m.name),
    datasets: [
      {
        label: "Emergency Cases Surge",
        data: stats.monthlyHistory.map((m) => m.count),
        fill: true,
        borderColor: "#0d9488",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "#0d9488",
      },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
            System Analytics & Reports
          </h2>
          <p className="text-[var(--text-secondary)] font-medium mt-1">
            Advanced intelligence metrics, demographic distribution and
            comprehensive report generation
          </p>
        </div>
      </div>

      {/* Report Generation Section */}
      <ReportGeneration />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsCard title="User Demographics">
          <div className="h-72 flex justify-center relative">
            <Doughnut
              data={roleData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: { size: 12, weight: "600" },
                      color: isDark ? "#94a3b8" : "#64748b",
                    },
                  },
                },
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
                  x: {
                    grid: { display: false },
                    ticks: { color: isDark ? "#94a3b8" : "#64748b" },
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(148, 163, 184, 0.1)",
                    },
                    ticks: { color: isDark ? "#94a3b8" : "#64748b" },
                  },
                },
              }}
            />
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
};

export default Analytics;
