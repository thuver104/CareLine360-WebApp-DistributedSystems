import { useState, useEffect, useRef } from 'react';
import { Video, Calendar, Clock, User, Users, Phone, CheckCircle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const MeetAssign = () => {
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
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
                const ad = new Date(a.date).toISOString().slice(0,10);
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meet Assign</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and assign video consultations</p>
                </div>
                <div className="flex gap-4 items-center">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="video">Video</option>
                        <option value="in-person">In-Person</option>
                        <option value="phone">Phone</option>
                    </select>

                    <button
                        onClick={fetchAppointments}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                        Refresh
                    </button>

                    <button
                        onClick={() => { setFilterDate(''); setFilterType('all'); }}
                        className="px-3 py-2 bg-white/10 text-sm rounded-xl"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {selectedMeeting ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl">
                                <Video className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Meeting with {selectedMeeting.patient?.fullName || 'Patient'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Doctor: {selectedMeeting.doctor?.fullName || 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeMeeting}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                        >
                            <XCircle size={24} className="text-gray-400" />
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div ref={jitsiContainerRef} className="rounded-2xl overflow-hidden shadow-inner bg-black min-h-[600px]">
                            {/* Jitsi meet will be mounted here */}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
                                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        ))
                    ) : appointments.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                                <Video size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white">No Appointments Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                                There are currently no appointments matching the selected filters.
                            </p>
                        </div>
                    ) : (
                        appointments.map((appt) => (
                            <div key={appt._id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${appt.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                        appt.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                        }`}>
                                        {((appt.consultationType || '').toLowerCase() === 'video') ? (
                                            <Video size={24} />
                                        ) : ((appt.consultationType || '').toLowerCase() === 'phone') ? (
                                            <Phone size={24} />
                                        ) : (
                                            <ExternalLink size={24} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            appt.status === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {appt.patient?.fullName || 'Unnamed Patient'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                    <User size={14} />
                                    Dr. {appt.doctor?.fullName || 'TBD'}
                                </p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Calendar size={16} className="text-gray-400" />
                                        {new Date(appt.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <Clock size={16} className="text-gray-400" />
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

                                {/* Actions based on consultation type */}
                                {((appt.consultationType || '').toLowerCase() === 'video') ? (
                                    appt.meetingUrl ? (
                                        <button
                                            onClick={() => startMeeting(appt)}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Video size={18} />
                                            Join Meeting
                                        </button>
                                    ) : appt.status === 'confirmed' ? (
                                        <button
                                            onClick={() => createMeeting(appt)}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Video size={18} />
                                            Create Meeting Link
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-4 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <Video size={18} />
                                            Meeting Unavailable
                                        </button>
                                    )
                                ) : ((appt.consultationType || '').toLowerCase() === 'phone') ? (
                                    appt.status === 'confirmed' ? (
                                        <button disabled className="w-full py-4 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                            <Phone size={18} />
                                            Meeting Scheduled
                                        </button>
                                    ) : appt.patient?.phone ? (
                                        <a href={`tel:${appt.patient.phone}`} className="w-full block text-center py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                                            <Phone size={18} className="inline-block mr-2" />
                                            Call Patient
                                        </a>
                                    ) : (
                                        <button disabled className="w-full py-4 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                            <Phone size={18} />
                                            No Phone
                                        </button>
                                    )
                                ) : (
                                    // in-person
                                    appt.status === 'confirmed' ? (
                                        <button disabled className="w-full py-4 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                            <Users size={18} />
                                            Meeting Scheduled
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2">
                                            <ExternalLink size={18} />
                                            In-Person Appointment
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
