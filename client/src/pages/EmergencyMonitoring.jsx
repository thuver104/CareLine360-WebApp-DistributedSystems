import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle2, MoreVertical, X, Calendar, User, Phone } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';
import EmergencyMap from '../components/EmergencyMap';

const safeFormatDate = (dateStr, formatStr) => {
    try {
        const d = new Date(dateStr);
        return isValid(d) ? format(d, formatStr) : 'N/A';
    } catch (e) {
        return 'N/A';
    }
};

const StatusBadge = ({ status }) => {
    const styles = {
        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
        DISPATCHED: 'bg-blue-100 text-blue-700 border-blue-200',
        ARRIVED: 'bg-purple-100 text-purple-700 border-purple-200',
        RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
            {status}
        </span>
    );
};

const EmergencyMonitoring = () => {
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmergency, setSelectedEmergency] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchEmergencies();
    }, []);

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

    const openModal = (emergency) => {
        setSelectedEmergency(emergency);
        setIsModalOpen(true);
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Emergency Monitoring</h2>
                <p className="text-slate-500">Live feed of active and resolved emergency cases</p>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-slate-500 text-sm">
                        <tr>
                            <th className="py-4 px-6 font-bold">PATIENT</th>
                            <th className="py-4 px-6 font-bold">TRIGGERED AT</th>
                            <th className="py-4 px-6 font-bold">STATUS</th>
                            <th className="py-4 px-6 font-bold">LOCATION</th>
                            <th className="py-4 px-6 font-bold text-right">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {emergencies.map((e) => (
                            <tr
                                key={e._id}
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => openModal(e)}
                            >
                                <td className="py-4 px-6">
                                    <div className="font-bold text-slate-900">{e.patient?.name}</div>
                                    <div className="text-xs text-slate-500 overflow-hidden text-ellipsis max-w-[200px] whitespace-nowrap">{e.description}</div>
                                </td>
                                <td className="py-4 px-6 text-sm text-slate-600">
                                    {safeFormatDate(e.triggeredAt, 'MMM dd, HH:mm')}
                                </td>
                                <td className="py-4 px-6">
                                    <StatusBadge status={e.status} />
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <MapPin size={12} className="text-secondary" />
                                        {e.latitude.toFixed(4)}, {e.longitude.toFixed(4)}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right" onClick={(event) => event.stopPropagation()}>
                                    <select
                                        value={e.status}
                                        onChange={(event) => updateStatus(e._id, event.target.value)}
                                        className="text-xs font-bold border rounded-lg px-2 py-1 outline-none bg-white focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="DISPATCHED">DISPATCHED</option>
                                        <option value="ARRIVED">ARRIVED</option>
                                        <option value="RESOLVED">RESOLVED</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && selectedEmergency && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Emergency Case Detail
                                    <StatusBadge status={selectedEmergency.status} />
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">ID: {selectedEmergency._id}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm"><User className="text-primary" size={20} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Information</p>
                                                <p className="font-bold text-lg">{selectedEmergency.patient?.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                                    <Phone size={14} /> {selectedEmergency.patient?.phone}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm"><Calendar className="text-primary" size={20} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Logs</p>
                                                <p className="text-sm font-medium">Triggered: {safeFormatDate(selectedEmergency.triggeredAt, 'PPP p')}</p>
                                                {selectedEmergency.resolvedAt && (
                                                    <p className="text-sm font-medium text-emerald-600">Resolved: {safeFormatDate(selectedEmergency.resolvedAt, 'PPP p')}</p>
                                                )}
                                            </div>
                                        </div>
                                        {selectedEmergency.responseTime && (
                                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                                                <p className="text-sm font-bold text-emerald-700">Total Response Time</p>
                                                <p className="text-xl font-black text-emerald-800">{selectedEmergency.responseTime} min</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Medical Description</p>
                                        <p className="p-4 bg-amber-50 rounded-xl text-slate-800 font-medium border border-amber-100 shadow-sm italic">
                                            "{selectedEmergency.description}"
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Live Map Location</p>
                                    <EmergencyMap emergency={selectedEmergency} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 rounded-xl border font-bold hover:bg-slate-100 transition-colors"
                            >
                                Close
                            </button>
                            {selectedEmergency.status !== 'RESOLVED' && (
                                <button
                                    onClick={() => updateStatus(selectedEmergency._id, 'RESOLVED')}
                                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Mark as Resolved
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
