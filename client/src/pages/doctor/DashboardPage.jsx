import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle, Users, BarChart2, Star } from "lucide-react";
import {
  getDoctorDashboard, getDoctorAppointments, updateAppointmentStatus,
  getDoctorPatients, getDoctorAnalytics, getAvailability,
} from "../../api/doctorApi";
import StatCard       from "../../components/ui/StatCard";
import QuickActionBar from "../../components/ui/QuickActionBar";
import ActivityFeed      from "../../components/dashboard/ActivityFeed";
import AnalyticsStrip    from "../../components/dashboard/AnalyticsStrip";
import SlotUtilisation   from "../../components/dashboard/SlotUtilisation";
import AppointmentsTable from "../../components/dashboard/AppointmentsTable";
import AvailabilityCalendar from "../../components/doctor/AvailabilityCalendar";
import MedicalRecordModal   from "../../components/doctor/MedicalRecordModal";
import PrescriptionModal    from "../../components/doctor/PrescriptionModal";
import ChatWidget           from "../../components/doctor/ChatWidget";
import { useDoctorContext } from "../../components/layout/DashboardLayout";
import { getInitials } from "../../utils/colors";

function TabNav({ tabs, active, onChange }) {
  return (
    <nav className="flex overflow-x-auto border-b border-gray-100 dark:border-white/10 px-4">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === t ? "border-teal-500 text-teal-600 dark:text-teal-400"
            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
          {t}
        </button>
      ))}
    </nav>
  );
}

export default function DashboardPage() {
  const { doctor } = useDoctorContext();
  const [tab, setTab] = useState("Overview");
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [todayAppts, setTodayAppts] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [slotsData, setSlotsData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [allAppts, setAllAppts] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptFilter, setApptFilter] = useState({ status: "", date: "", search: "" });
  const [apptPagination, setApptPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientPagination, setPatientPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [chatAppt, setChatAppt] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const [prescripModal, setPrescripModal] = useState(null);

  useEffect(() => {
    getDoctorDashboard().then((r) => setDashData(r.data)).catch(console.error).finally(() => setDashLoading(false));
    const today = new Date().toISOString().split("T")[0];
    getDoctorAppointments({ date: today, limit: 10 }).then((r) => setTodayAppts(r.data.appointments || [])).catch(console.error).finally(() => setTodayLoading(false));
    getAvailability().then((r) => buildSlotUtilisation(r.data.slots || [])).catch(console.error);
  }, []);

  const buildSlotUtilisation = (slots) => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const colorKeys = ["teal","cyan","violet","rose","amber","emerald","blue"];
    const byDay = days.map((dayLabel, idx) => {
      const daySlots = slots.filter((s) => new Date(s.date + "T00:00:00").getDay() === idx);
      const total = daySlots.length;
      const booked = daySlots.filter((s) => s.isBooked).length;
      return { label: dayLabel, pct: total > 0 ? Math.round((booked / total) * 100) : 0, colorKey: colorKeys[idx % colorKeys.length] };
    }).filter((d) => slots.some((s) => new Date(s.date + "T00:00:00").getDay() === days.indexOf(d.label)));
    const total = slots.length;
    const booked = slots.filter((s) => s.isBooked).length;
    setSlotsData({ data: byDay, summary: { total, booked, free: total - booked } });
  };

  const loadAppointments = useCallback(async (page = 1) => {
    setApptLoading(true);
    try {
      const { data } = await getDoctorAppointments({ page, limit: 10, ...apptFilter });
      setAllAppts(data.appointments || []);
      setApptPagination(data.pagination || { page, pages: 1, total: 0 });
    } catch (e) { console.error(e); } finally { setApptLoading(false); }
  }, [apptFilter]);

  useEffect(() => { if (tab === "Appointments") loadAppointments(1); }, [tab, loadAppointments]);

  const loadPatients = useCallback(async (page = 1) => {
    setPatientLoading(true);
    try {
      const { data } = await getDoctorPatients({ page, limit: 10, search: patientSearch });
      setPatients(data.patients || []);
      setPatientPagination(data.pagination || { page, pages: 1, total: 0 });
    } catch (e) { console.error(e); } finally { setPatientLoading(false); }
  }, [patientSearch]);

  useEffect(() => { if (tab === "Patients") loadPatients(1); }, [tab, loadPatients]);

  useEffect(() => {
    if (tab === "Analytics") {
      setAnalyticsLoading(true);
      getDoctorAnalytics().then((r) => setAnalyticsData(r.data)).catch(console.error).finally(() => setAnalyticsLoading(false));
    }
  }, [tab]);

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await updateAppointmentStatus(appointmentId, { status });
      const today = new Date().toISOString().split("T")[0];
      getDoctorAppointments({ date: today, limit: 10 }).then((r) => setTodayAppts(r.data.appointments || []));
      if (tab === "Appointments") loadAppointments(apptPagination.page);
      getDoctorDashboard().then((r) => setDashData(r.data)).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const buildActivities = () => todayAppts.slice(0, 5).map((a) => ({
    type: a.status === "completed" ? "completed" : a.status === "cancelled" ? "alert" : "appointment",
    message: `Appointment with ${a.patientProfile?.fullName || "patient"} — ${a.status}`,
    time: `${new Date(a.date).toLocaleDateString("en-GB")} · ${a.time || ""}`,
  }));

  const buildAnalyticsStrip = () => {
    if (!dashData?.stats) return [];
    const { totalAppointments, completedAppointments, pendingAppointments, totalPatients } = dashData.stats;
    const compRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
    return [
      { label: "Completion Rate", value: `${compRate}%`, pct: compRate, colorKey: "teal" },
      { label: "Avg Rating", value: dashData.doctor?.rating ? `${Number(dashData.doctor.rating).toFixed(1)}/5` : "—", pct: ((dashData.doctor?.rating || 0) / 5) * 100, colorKey: "amber" },
      { label: "Patients", value: totalPatients, pct: Math.min((totalPatients / 50) * 100, 100), colorKey: "violet" },
      { label: "Pending", value: pendingAppointments, pct: Math.min((pendingAppointments / 10) * 100, 100), colorKey: "rose" },
    ];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {doctor && (
        <div className="welcome-banner rounded-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {doctor.avatarUrl
              ? <img src={doctor.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30" />
              : <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">{getInitials(doctor.fullName)}</div>
            }
            <div>
              <p className="text-white font-bold text-lg leading-tight">Dr. {doctor.fullName}</p>
              <p className="text-white/70 text-sm">{doctor.specialization}</p>
              {doctor.doctorId && <p className="text-white/50 text-xs mt-0.5">{doctor.doctorId}</p>}
            </div>
          </div>
          {doctor.rating > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white font-bold text-sm flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              {Number(doctor.rating).toFixed(1)} / 5
            </div>
          )}
        </div>
      )}

      <QuickActionBar
        onAddRecord={() => setRecordModal({ patientId: null })}
        onSetAvailability={() => setTab("Availability")}
        onGenPrescription={() => setPrescripModal({ patientId: null })}
        onFilterAppts={() => setTab("Appointments")}
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <TabNav tabs={["Overview","Appointments","Patients","Availability","Analytics"]} active={tab} onChange={setTab} />
        <div className="p-6">

          {tab === "Overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
                <StatCard icon={Calendar} label="Today's Appointments" value={dashData?.stats?.todayAppointments} colorKey="teal" loading={dashLoading} />
                <StatCard icon={Clock} label="Pending" value={dashData?.stats?.pendingAppointments} colorKey="amber" loading={dashLoading} />
                <StatCard icon={CheckCircle} label="Completed" value={dashData?.stats?.completedAppointments} colorKey="emerald" loading={dashLoading} />
                <StatCard icon={Users} label="Total Patients" value={dashData?.stats?.totalPatients} colorKey="violet" loading={dashLoading} />
              </div>
              <AppointmentsTable appointments={todayAppts} loading={todayLoading}
                onConfirm={(id) => handleStatusChange(id, "confirmed")}
                onCancel={(id) => handleStatusChange(id, "cancelled")}
                onAddRecord={(a) => setRecordModal({ patientId: a.patientProfile?._id, appointmentId: a._id })}
                onPrescription={(a) => setPrescripModal({ patientId: a.patientProfile?._id, appointmentId: a._id, patientName: a.patientProfile?.fullName })}
                onChat={(a) => setChatAppt(a)} onViewAll={() => setTab("Appointments")} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityFeed activities={buildActivities()} loading={todayLoading} onSeeAll={() => setTab("Appointments")} />
                <SlotUtilisation data={slotsData?.data || []} summary={slotsData?.summary || null} />
              </div>
              <AnalyticsStrip data={buildAnalyticsStrip()} loading={dashLoading} onFull={() => setTab("Analytics")} />
            </div>
          )}

          {tab === "Appointments" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {/* Status filter — styled dropdown with colour-coded options */}
                <div className="relative">
                  <select
                    value={apptFilter.status}
                    onChange={(e) => setApptFilter((p) => ({ ...p, status: e.target.value }))}
                    className={`
                      appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium cursor-pointer
                      border-2 focus:outline-none focus:ring-2 transition-all
                      ${apptFilter.status === ""          ? "border-teal-500   bg-teal-900/40   text-teal-300   focus:ring-teal-500"   : ""}
                      ${apptFilter.status === "pending"   ? "border-amber-500  bg-amber-900/40  text-amber-300  focus:ring-amber-500"  : ""}
                      ${apptFilter.status === "confirmed" ? "border-blue-500   bg-blue-900/40   text-blue-300   focus:ring-blue-500"   : ""}
                      ${apptFilter.status === "completed" ? "border-emerald-500 bg-emerald-900/40 text-emerald-300 focus:ring-emerald-500" : ""}
                      ${apptFilter.status === "cancelled" ? "border-rose-500   bg-rose-900/40   text-rose-300   focus:ring-rose-500"   : ""}
                    `}
                    style={{ minWidth: "140px" }}
                  >
                    <option value=""          style={{ background: "#0d2b29", color: "#5eead4" }}>All Status</option>
                    <option value="pending"   style={{ background: "#2d1c07", color: "#fbbf24" }}>🟡 Pending</option>
                    <option value="confirmed" style={{ background: "#0c1f3d", color: "#60a5fa" }}>🔵 Confirmed</option>
                    <option value="completed" style={{ background: "#092b18", color: "#4ade80" }}>🟢 Completed</option>
                    <option value="cancelled" style={{ background: "#2d0a14", color: "#fb7185" }}>🔴 Cancelled</option>
                  </select>
                  {/* Custom chevron */}
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>


                <input type="date" value={apptFilter.date} onChange={(e) => setApptFilter((p) => ({ ...p, date: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="text" placeholder="Search patient…" value={apptFilter.search} onChange={(e) => setApptFilter((p) => ({ ...p, search: e.target.value }))}
                  className="px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 min-w-48" />
                <button onClick={() => loadAppointments(1)} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors">Search</button>
                <button onClick={() => setApptFilter({ status: "", date: "", search: "" })} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Clear</button>
              </div>
              <AppointmentsTable appointments={allAppts} loading={apptLoading}
                onConfirm={(id) => handleStatusChange(id, "confirmed")}
                onCancel={(id) => handleStatusChange(id, "cancelled")}
                onAddRecord={(a) => setRecordModal({ patientId: a.patientProfile?._id, appointmentId: a._id })}
                onPrescription={(a) => setPrescripModal({ patientId: a.patientProfile?._id, appointmentId: a._id, patientName: a.patientProfile?.fullName })}
                onChat={(a) => setChatAppt(a)} />
              {apptPagination.pages > 1 && (
                <div className="flex items-center justify-between px-2 pt-2">
                  <p className="text-xs text-gray-500">Total: {apptPagination.total}</p>
                  <div className="flex gap-1">
                    <button disabled={apptPagination.page <= 1} onClick={() => loadAppointments(apptPagination.page - 1)} className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40">←</button>
                    <span className="px-3 py-1 text-xs text-gray-500">{apptPagination.page} / {apptPagination.pages}</span>
                    <button disabled={apptPagination.page >= apptPagination.pages} onClick={() => loadAppointments(apptPagination.page + 1)} className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40">→</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Patients" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input type="text" placeholder="Search by name or patient ID…" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1" />
                <button onClick={() => loadPatients(1)} className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">Search</button>
                <button onClick={() => setPatientSearch("")} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 text-gray-500">Clear</button>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
                {patientLoading ? <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
                : patients.length === 0 ? <div className="py-10 text-center text-gray-400 text-sm">No patients found.</div>
                : patients.map((p) => (
                  <div key={p._id} className="px-5 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">{getInitials(p.fullName)}</div>}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{p.fullName}</p>
                        <p className="text-[10px] text-gray-400">{p.patientId} · {p.userId?.email || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.bloodGroup && <span className="text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400">{p.bloodGroup}</span>}
                      <button onClick={() => setRecordModal({ patientId: p._id })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-200 transition-colors">Add Record</button>
                      <button onClick={() => setPrescripModal({ patientId: p._id, patientName: p.fullName })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 hover:bg-violet-200 transition-colors">Prescription</button>
                    </div>
                  </div>
                ))}
              </div>
              {patientPagination.pages > 1 && (
                <div className="flex items-center justify-between px-2 pt-2">
                  <p className="text-xs text-gray-500">Total: {patientPagination.total}</p>
                  <div className="flex gap-1">
                    <button disabled={patientPagination.page <= 1} onClick={() => loadPatients(patientPagination.page - 1)} className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40">←</button>
                    <span className="px-3 py-1 text-xs text-gray-500">{patientPagination.page} / {patientPagination.pages}</span>
                    <button disabled={patientPagination.page >= patientPagination.pages} onClick={() => loadPatients(patientPagination.page + 1)} className="px-2.5 py-1 rounded-lg text-xs glass-btn text-gray-600 dark:text-gray-300 disabled:opacity-40">→</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Availability" && <AvailabilityCalendar />}

          {tab === "Analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
                <StatCard icon={Calendar} label="This Month" value={analyticsData?.thisMonthAppointments} colorKey="teal" loading={analyticsLoading} />
                <StatCard icon={BarChart2} label="Last Month" value={analyticsData?.lastMonthAppointments} colorKey="blue" loading={analyticsLoading} />
                <StatCard icon={Star} label="Average Rating" value={analyticsData?.rating ? `${Number(analyticsData.rating).toFixed(1)} / 5` : "—"} colorKey="amber" loading={analyticsLoading} />
              </div>
              {analyticsData && (
                <AnalyticsStrip data={[
                  { label: "This Month", value: analyticsData.thisMonthAppointments, pct: Math.min((analyticsData.thisMonthAppointments / Math.max(analyticsData.lastMonthAppointments, 1)) * 100, 100), colorKey: "teal" },
                  { label: "Last Month", value: analyticsData.lastMonthAppointments, pct: 100, colorKey: "blue" },
                  { label: "Avg Rating", value: `${Number(analyticsData.rating || 0).toFixed(1)}/5`, pct: (analyticsData.rating / 5) * 100, colorKey: "amber" },
                  { label: "Total Ratings", value: analyticsData.totalRatings, pct: Math.min((analyticsData.totalRatings / 50) * 100, 100), colorKey: "violet" },
                ]} />
              )}
              {analyticsData?.appointmentsByStatus?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">By Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {analyticsData.appointmentsByStatus.map((s) => (
                      <div key={s._id} className="px-5 py-3 rounded-xl glass-card">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.count}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{s._id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {chatAppt && <ChatWidget appointment={chatAppt} onClose={() => setChatAppt(null)} />}
      {recordModal && (
        <MedicalRecordModal patientId={recordModal.patientId} appointmentId={recordModal.appointmentId}
          onClose={() => setRecordModal(null)}
          onSaved={() => { setRecordModal(null); if (tab === "Appointments") loadAppointments(apptPagination.page); }} />
      )}
      {prescripModal && (
        <PrescriptionModal patientId={prescripModal.patientId} appointmentId={prescripModal.appointmentId}
          patientName={prescripModal.patientName} onClose={() => setPrescripModal(null)} />
      )}
    </div>
  );
}