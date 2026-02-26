import { useState, useEffect, useRef } from 'react';
import { Video, Calendar, Clock, User, Users, Phone, CheckCircle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MeetAssign = () => {
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [filterType, setFilterType] = useState('all');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const jitsiContainerRef = useRef(null);
    const [jitsiApi, setJitsiApi] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        // apply client-side filters whenever appointments or filters change
        applyFilters();
    }, [allAppointments, filterDate, filterType]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/appointments');
            // Server returns { status: 200, data: [...] }.
            const list = response.data?.data || response.data;
            if (Array.isArray(list)) {
                // store all appointments and let filters decide what to show
                setAllAppointments(list);
            } else {
                setAllAppointments([]);
                setAppointments([]);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allAppointments];
        if (filterType && filterType !== 'all') {
            filtered = filtered.filter(a => (a.consultationType || '').toLowerCase() === filterType);
        }
        if (filterDate) {
            filtered = filtered.filter(a => {
                const ad = new Date(a.date).toISOString().slice(0, 10);
                return ad === filterDate;
            });
        }
        setAppointments(filtered);
    };

    const createMeeting = async (appt) => {
        try {
            // Call backend to create/save meeting link
            const res = await api.post(`/admin/appointments/${appt._id}/meeting`);
            const updated = res.data?.data || res.data;
            // update appointments state and allAppointments
            setAppointments((prev) => prev.map(a => a._id === appt._id ? updated : a));
            setAllAppointments((prev) => prev.map(a => a._id === appt._id ? updated : a));
            toast.success('Meeting link created');
        } catch (err) {
            console.error('Failed to create meeting link', err);
            toast.error('Failed to create meeting link');
        }
    };

    const startMeeting = (appointment) => {
        setSelectedMeeting(appointment);

        // Load Jitsi Script dynamically if not already loaded
        if (!window.JitsiMeetExternalAPI) {
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = () => initializeJitsi(appointment);
            document.body.appendChild(script);
        } else {
            initializeJitsi(appointment);
        }
    };

    const initializeJitsi = (appointment) => {
        if (jitsiApi) {
            jitsiApi.dispose();
        }

        const domain = 'meet.jit.si';
        const roomName = `CareLine360-${appointment._id}`;
        const options = {

            roomName: roomName,
            width: '100%',
            height: 600,
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: 'Admin - CareLine360'
            },
            interfaceConfigOverwrite: {
                // Customize interface as needed
            },
            configOverwrite: {
                startWithAudioMuted: true,
                disableThirdPartyRequests: true
            }
        };

        const apiInstance = new window.JitsiMeetExternalAPI(domain, options);
        setJitsiApi(apiInstance);
    };

    const closeMeeting = () => {
        if (jitsiApi) {
            jitsiApi.dispose();
            setJitsiApi(null);
        }
        setSelectedMeeting(null);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Meet Assignment Hub</h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Orchestrate and assign specialized video consultations</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center p-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[24px] shadow-inner">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-black uppercase tracking-wider outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
                    />

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-black uppercase tracking-wider outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="all">ALL MODALITIES</option>
                        <option value="video">VIDEO</option>
                        <option value="in-person">IN-PERSON</option>
                        <option value="phone">PHONE</option>
                    </select>

                    <button
                        onClick={fetchAppointments}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 active:scale-95 shadow-sm shadow-teal-500/20"
                    >
                        Refresh
                    </button>

                    <button
                        onClick={() => { setFilterDate(''); setFilterType('all'); }}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {selectedMeeting ? (
                <div className="bg-[var(--bg-surface)] rounded-[32px] shadow-2xl overflow-hidden border border-[var(--border)] mb-12 animate-in zoom-in-95 duration-300">
                    <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-subtle)]">
                        <div className="flex items-center gap-6">
                            <div className="bg-teal-500/10 p-4 rounded-2xl text-teal-600 shadow-inner">
                                <Video size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    Live Session: {selectedMeeting.patient?.fullName || 'Identity Pending'}
                                </h2>
                                <p className="text-xs font-black text-teal-600 uppercase tracking-widest mt-1">
                                    Primary Consultant: Dr. {selectedMeeting.doctor?.fullName || 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeMeeting}
                            className="p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all text-[var(--text-muted)]"
                        >
                            <XCircle size={28} />
                        </button>
                    </div>
                    <div className="p-6 bg-[var(--bg-surface)]">
                        <div ref={jitsiContainerRef} className="rounded-3xl overflow-hidden shadow-2xl bg-slate-950 min-h-[600px] border border-[var(--border)]">
                            {/* Jitsi meet will be mounted here */}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-pulse">
                                <div className="h-12 w-12 bg-[var(--bg-subtle)] rounded-2xl mb-4"></div>
                                <div className="h-6 w-3/4 bg-[var(--bg-subtle)] rounded-lg mb-2"></div>
                                <div className="h-4 w-1/2 bg-[var(--bg-subtle)] rounded-lg"></div>
                            </div>
                        ))
                    ) : appointments.length === 0 ? (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                            <div className="bg-[var(--bg-subtle)] p-8 rounded-full mb-6 border border-[var(--border)] shadow-inner">
                                <Video size={48} className="text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">No Appointments Found</h3>
                            <p className="text-[var(--text-secondary)] mt-2 max-w-sm font-medium">
                                There are currently no appointments matching the selected filters.
                            </p>
                        </div>
                    ) : (
                        appointments.map((appt) => (
                            <div key={appt._id} className="bg-[var(--bg-surface)] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 border border-[var(--border)] group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3.5 rounded-2xl ${appt.priority === 'high' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                        appt.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                            'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                        } group-hover:scale-110 transition-transform duration-300`}>
                                        {((appt.consultationType || '').toLowerCase() === 'video') ? (
                                            <Video size={24} />
                                        ) : ((appt.consultationType || '').toLowerCase() === 'phone') ? (
                                            <Phone size={24} />
                                        ) : (
                                            <ExternalLink size={24} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                            appt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                                'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 tracking-tight">
                                    {appt.patient?.fullName || 'Identity Pending'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mb-6 flex items-center gap-2 font-bold uppercase tracking-widest italic">
                                    <User size={13} className="text-teal-500" />
                                    Dr. {appt.doctor?.fullName || 'Awaiting Assignment'}
                                </p>

                                <div className="space-y-3 mb-8 bg-[var(--bg-subtle)] p-4 rounded-2xl border border-[var(--border)]">
                                    <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
                                        <Calendar size={14} className="text-teal-500" />
                                        {new Date(appt.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-secondary)]">
                                        <Clock size={14} className="text-teal-500" />
                                        {appt.time}
                                    </div>

                                    {((appt.consultationType || '').toLowerCase() === 'video') && (
                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <a
                                                href={appt.meetingUrl ? `${appt.meetingUrl}/static/dialInInfo.html?room=${appt.meetingUrl.split('/').pop()}` : `https://meet.jit.si/static/dialInInfo.html?room=CareLine360-${appt._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <Phone size={12} />
                                                View Dial-in Info
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {((appt.consultationType || '').toLowerCase() === 'video') ? (
                                    appt.meetingUrl ? (
                                        <button
                                            onClick={() => startMeeting(appt)}
                                            className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
                                        >
                                            <Video size={18} />
                                            Start Session
                                        </button>
                                    ) : appt.status === 'confirmed' ? (
                                        <button
                                            onClick={() => createMeeting(appt)}
                                            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                                        >
                                            <Video size={18} />
                                            Initialize Meet
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-3.5 bg-[var(--bg-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-[var(--border)]"
                                        >
                                            <Video size={18} />
                                            Meet Unavailable
                                        </button>
                                    )
                                ) : ((appt.consultationType || '').toLowerCase() === 'phone') ? (
                                    appt.status === 'confirmed' ? (
                                        <button disabled className="w-full py-3.5 bg-[var(--bg-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-[var(--border)]">
                                            <Phone size={18} />
                                            Session Locked
                                        </button>
                                    ) : appt.patient?.phone ? (
                                        <a href={`tel:${appt.patient.phone}`} className="w-full block text-center py-3.5 bg-teal-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                                            <Phone size={18} className="inline-block mr-2" />
                                            Contact Now
                                        </a>
                                    ) : (
                                        <button disabled className="w-full py-3.5 bg-[var(--bg-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-[var(--border)]">
                                            <Phone size={18} />
                                            No Registry
                                        </button>
                                    )
                                ) : (
                                    // in-person
                                    appt.status === 'confirmed' ? (
                                        <button disabled className="w-full py-3.5 bg-[var(--bg-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-[var(--border)]">
                                            <Users size={18} />
                                            In-Person Logged
                                        </button>
                                    ) : (
                                        <div className="w-full py-3.5 bg-[var(--bg-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-[var(--border)] text-[10px]">
                                            <ExternalLink size={16} />
                                            Hospital Visit
                                        </div>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MeetAssign;
