import { Calendar, Clock, FileText, Star } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import QuickActionBar from "../../components/ui/QuickActionBar";
import AppointmentsTable from "../../components/dashboard/AppointmentsTable";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import SlotUtilisation from "../../components/dashboard/SlotUtilisation";
import MedicalRecordsGrid from "../../components/dashboard/MedicalRecordsGrid";
import AnalyticsStrip from "../../components/dashboard/AnalyticsStrip";
import { STATS, DOCTOR_INFO } from "../../utils/dashboardData";

// Map stat icon strings to actual Lucide components
const ICON_MAP = {
  appointments: Calendar,
  pending: Clock,
  records: FileText,
  rating: Star,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome Banner ── */}
      <div className="welcome-banner rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-20 w-20 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1 font-medium">
            Good morning 👋
          </p>
          <h2 className="text-white text-xl font-bold">{DOCTOR_INFO.name}</h2>
          <p className="text-white/60 text-xs mt-1">
            {DOCTOR_INFO.specialty} · CareLine360
          </p>
        </div>

        <div className="relative z-10 hidden sm:flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-medium">
              Online & Accepting Patients
            </span>
          </div>
          <p className="text-white/50 text-[10px]">
            Component 2 – Doctor &amp; Medical Records Management
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <QuickActionBar />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <StatCard
            key={stat.id}
            {...stat}
            icon={ICON_MAP[stat.id] || Calendar}
          />
        ))}
      </div>

      {/* ── Main 3-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments table spans 2 cols */}
        <div className="lg:col-span-2">
          <AppointmentsTable />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <ActivityFeed />
          <SlotUtilisation />
        </div>
      </div>

      {/* ── Medical Records ── */}
      <MedicalRecordsGrid />

      {/* ── Analytics strip ── */}
      <AnalyticsStrip />
    </div>
  );
}
