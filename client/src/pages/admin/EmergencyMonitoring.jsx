import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle2, MoreVertical, X, Calendar, User, Phone } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import EmergencyMap from '../../components/EmergencyMap';

const safeFormatDate = (dateStr, formatStr) => {
    try {
        const d = new Date(dateStr);
        return isValid(d) ? format(d, formatStr) : '—';
    } catch (e) {
        return '—';
    }
};

const StatusBadge = ({ status }) => {
    const styles = {
        PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        DISPATCHED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        ARRIVED: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        RESOLVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${styles[status]}`}>
            {status}
        </span>
    );
};

const EmergencyMonitoring = () => {
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('monitor');
    const [hospitals, setHospitals] = useState([]);
    const [newHospital, setNewHospital] = useState({ name: '', address: '', contact: '', lat: '', lng: '' });
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchEmergencies();
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const response = await api.get('/hospitals');
            setHospitals(response.data.data);
        } catch (error) {
            console.error('Failed to load hospitals');
        }
    };

    const fetchEmergencies = async () => {
        try {
            const response = await api.get('/emergency');
            setEmergencies(response.data.data);
        } catch (error) {
            toast.error('Failed to load emergencies');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const response = await api.patch(`/emergency/${id}/status`, { status });
            setEmergencies(emergencies.map(e => e._id === id ? { ...e, status: response.data.data.status, resolvedAt: response.data.data.resolvedAt, responseTime: response.data.data.responseTime } : e));
            if (selectedEmergency && selectedEmergency._id === id) {
                setSelectedEmergency({ ...selectedEmergency, status: response.data.data.status, resolvedAt: response.data.data.resolvedAt, responseTime: response.data.data.responseTime });
            }
            toast.success(`Status updated to ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleNewHospitalChange = (field, value) => {
        setNewHospital(prev => ({ ...prev, [field]: value }));
    };

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported by this browser');
            return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setNewHospital(prev => ({ ...prev, lat: String(latitude), lng: String(longitude) }));
            toast.success('Location fetched');
        }, (err) => {
            toast.error('Unable to retrieve location');
        }, { enableHighAccuracy: true, timeout: 10000 });
    };

    const openModal = (emergency) => {
        setSelectedEmergency(emergency);
        setIsModalOpen(true);
    };

    const handleAddHospital = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/hospitals', newHospital);
            setHospitals([response.data.data, ...hospitals]);
            setNewHospital({ name: '', address: '', contact: '', lat: '', lng: '' });
            toast.success('Hospital added to database');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add hospital');
        }
    };

    const handleRemoveHospital = async (id) => {
        try {
            await api.delete(`/hospitals/${id}`);
            setHospitals(hospitals.filter(h => h._id !== id));
            toast.success('Hospital removed');
        } catch (error) {
            toast.error('Failed to remove hospital');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="text-slate-500 font-medium italic">Streaming Rescue Telemetry...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Emergency Dispatch Hub</h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Real-time situational awareness and responder orchestration</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Feed Active</span>
                </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl w-fit">
                <button className={`px-6 py-2 rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest ${activeTab === 'monitor' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} onClick={() => setActiveTab('monitor')}>Monitor</button>
                <button className={`px-6 py-2 rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest ${activeTab === 'config' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} onClick={() => setActiveTab('config')}>Config</button>
            </div>

            {activeTab === 'monitor' && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden text-left">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.25em]">
                                <tr>
                                    <th className="py-5 px-8">Case Subject</th>
                                    <th className="py-5 px-8">Registry Timestamp</th>
                                    <th className="py-5 px-8">Condition</th>
                                    <th className="py-5 px-8">Spatial Node</th>
                                    <th className="py-5 px-8 text-right">Dispatch Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {emergencies.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-slate-500 italic font-medium">No active or historical emergency cases discovered.</td>
                                    </tr>
                                ) : emergencies.map((e) => (
                                    <tr
                                        key={e._id}
                                        className="hover:bg-[var(--bg-subtle)] transition-all duration-300 cursor-pointer"
                                        onClick={() => openModal(e)}
                                    >
                                        <td className="py-5 px-6">
                                            <div className="font-bold text-[var(--text-primary)] text-base">{e.patient?.fullName || 'Identity Pending'}</div>
                                            <div className="text-xs text-[var(--text-secondary)] font-medium max-w-[280px] truncate italic">"{e.description}"</div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                                                <Calendar size={14} className="text-teal-500" />
                                                {safeFormatDate(e.triggeredAt, 'HH:mm — MMM dd')}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <StatusBadge status={e.status} />
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] group">
                                                <MapPin size={14} className="text-teal-500" />
                                                <span className="font-mono tracking-tighter">{e.latitude?.toFixed(5) || 0}, {e.longitude?.toFixed(5) || 0}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right" onClick={(event) => event.stopPropagation()}>
                                            <select
                                                value={e.status}
                                                onChange={(event) => updateStatus(e._id, event.target.value)}
                                                className="text-[11px] font-black border border-[var(--border)] rounded-xl px-3 py-1.5 outline-none bg-[var(--bg-surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="PENDING">SET PENDING</option>
                                                <option value="DISPATCHED">DISPATCH HELP</option>
                                                <option value="ARRIVED">MARK ARRIVED</option>
                                                <option value="RESOLVED">CLOSE CASE</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="space-y-8 text-left">
                    {/* Add Hospital Form */}
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm p-8">
                        <div className="mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Register New Hospital</h3>
                        </div>
                        <form onSubmit={handleAddHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hospital Name</label>
                                <input
                                    value={newHospital.name}
                                    onChange={(e) => handleNewHospitalChange('name', e.target.value)}
                                    placeholder="e.g. City General Hospital"
                                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact (Phone / Email)</label>
                                <input
                                    value={newHospital.contact}
                                    onChange={(e) => handleNewHospitalChange('contact', e.target.value)}
                                    placeholder="e.g. +94 11 234 5678"
                                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Address</label>
                                <input
                                    value={newHospital.address}
                                    onChange={(e) => handleNewHospitalChange('address', e.target.value)}
                                    placeholder="e.g. 25 Kynsey Road, Colombo 08"
                                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Latitude</label>
                                <input
                                    value={newHospital.lat}
                                    onChange={(e) => handleNewHospitalChange('lat', e.target.value)}
                                    placeholder="e.g. 6.92714"
                                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Longitude</label>
                                <input
                                    value={newHospital.lng}
                                    onChange={(e) => handleNewHospitalChange('lng', e.target.value)}
                                    placeholder="e.g. 79.86120"
                                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 md:col-span-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleFetchLocation}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-teal-500/20"
                                >
                                    <MapPin size={14} /> Use Current Location
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                                >
                                    Add Hospital
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewHospital({ name: '', address: '', contact: '', lat: '', lng: '' })}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Hospital List */}
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-teal-500 rounded-full"></div>
                                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Registered Hospitals</h3>
                            </div>
                        </div>
                        {hospitals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                                <MapPin size={32} className="opacity-30" />
                                <p className="text-sm font-medium italic">No hospitals registered in the network.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {hospitals.map(h => (
                                    <li key={h._id} className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl flex justify-between items-center transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-lg shrink-0 border border-teal-500/20">
                                                🏥
                                            </div>
                                            <div>
                                                <div className="font-black text-[var(--text-primary)] leading-tight">{h.name}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]">
                                                        <MapPin size={10} className="text-teal-500" /> {h.address || 'No Address Listed'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]">
                                                        <Phone size={10} className="text-teal-500" /> {h.contact || 'No Contact Listed'}
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-mono font-black text-teal-600/60 dark:text-teal-500/60 mt-1 uppercase tracking-tighter">
                                                    Node: {h.lat?.toFixed ? h.lat.toFixed(5) : h.lat}, {h.lng?.toFixed ? h.lng.toFixed(5) : h.lng}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveHospital(h._id)}
                                            className="px-4 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0"
                                        >
                                            Decommission
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Rescue Detail Modal */}
            {isModalOpen && selectedEmergency && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Overlay: only this should be faded/blurred */}
                    <div className="absolute inset-0 bg-slate-950/70 animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    {/* Modal content: remove bg opacity/blur classes, ensure full opacity */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 z-10">

                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 text-left shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl shadow-inner">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        Rescue Operations Case
                                        <StatusBadge status={selectedEmergency.status} />
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Ref: {selectedEmergency._id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                                <div className="lg:col-span-5 space-y-6 text-left">
                                    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-teal-600 shadow-sm"><User size={20} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Subject Records</p>
                                                <p className="font-bold text-lg text-slate-900 dark:text-white">{selectedEmergency.patient?.fullName || 'Identity Pending'}</p>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1">
                                                    <Phone size={12} className="text-teal-500" /> {selectedEmergency.patient?.phone || 'No Contact Listed'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-teal-600 shadow-sm"><Calendar size={20} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Incident Timeline</p>
                                                <div className="space-y-0.5 mt-1">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Started: <span className="font-mono">{safeFormatDate(selectedEmergency.triggeredAt, 'HH:mm:ss — MMM dd')}</span></p>
                                                    {selectedEmergency.resolvedAt && (
                                                        <p className="text-xs font-bold text-emerald-600">Resolved: <span className="font-mono">{safeFormatDate(selectedEmergency.resolvedAt, 'HH:mm:ss — MMM dd')}</span></p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedEmergency.responseTime && (
                                            <div className="bg-emerald-500/10 dark:bg-emerald-400/10 p-5 rounded-xl border border-emerald-500/20 flex flex-col items-center gap-0.5 group overflow-hidden relative transition-all">
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] relative">Network Response Delta</p>
                                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 relative tracking-tighter">{selectedEmergency.responseTime}<span className="text-sm ml-1">minutes</span></p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            Patient Signal Context
                                        </h4>
                                        <div className="p-6 bg-amber-50/40 dark:bg-amber-900/10 rounded-2xl text-slate-800 dark:text-amber-100/90 font-bold border border-amber-100/60 dark:border-amber-700/30 shadow-inner italic leading-relaxed text-base text-center">
                                            "{selectedEmergency.description || 'No verbal signal detected.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                            Spatial Telemetry Layer
                                        </h4>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter">{selectedEmergency.latitude?.toFixed(6)}, {selectedEmergency.longitude?.toFixed(6)}</span>
                                    </div>
                                    <div className="flex-1 min-h-[350px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-visible">
                                        <EmergencyMap emergency={selectedEmergency} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 text-sm"
                            >
                                Dismiss
                            </button>
                            {selectedEmergency.status !== 'RESOLVED' && (
                                <button
                                    onClick={() => updateStatus(selectedEmergency._id, 'RESOLVED')}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 text-sm"
                                >
                                    <CheckCircle2 size={18} /> Close case
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyMonitoring;
