import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ToggleLeft, ToggleRight, User as UserIcon, ChevronLeft, ChevronRight, X, Phone, Mail, MapPin, Calendar, Activity, GraduationCap, Award, Briefcase, DollarSign } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [doctorReviews, setDoctorReviews] = useState([]);

    // Add User Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'patient'
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [page, searchTerm, roleFilter]);

    useEffect(() => {
        if (selectedUser && selectedUser.role === 'doctor') {
            api.get(`/ratings/doctor/${selectedUser._id}`)
                .then(res => setDoctorReviews(res.data.reviews || []))
                .catch(() => setDoctorReviews([]));
        } else {
            setDoctorReviews([]);
        }
    }, [selectedUser]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users?page=${page}&limit=10&search=${searchTerm}&role=${roleFilter}`);
            const { users, total, pages } = response.data.data;
            setUsers(users);
            setTotalUsers(total);
            setTotalPages(pages);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId) => {
        try {
            await api.patch(`/admin/users/${userId}/toggle-status`);
            setUsers(users.map(u =>
                u._id === userId ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : u
            ));
            toast.success('User status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            toast.success('User created successfully');
            setShowAddModal(false);
            setFormData({ fullName: '', email: '', phone: '', password: '', role: 'patient' });
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to create user';
            toast.error(msg);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openDetailModal = (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Total {totalUsers} users registered in the system</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
                >
                    <Plus size={20} />
                    Add New User
                </button>
            </div>

            {/* Filter & Search Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex gap-2 min-w-[180px]">
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white font-medium"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Roles</option>
                            <option value="patient">Patients</option>
                            <option value="doctor">Doctors</option>
                            <option value="responder">Responders</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Table Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">User Identity</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Designation</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-5 px-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800"></div><div className="space-y-2"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div><div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-48"></div></div></div></td>
                                        <td className="py-5 px-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                                        <td className="py-5 px-6"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20"></div></td>
                                        <td className="py-5 px-6"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-24 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => openDetailModal(user)}>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shadow-sm">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{user.name || 'No Name'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">{user.email || user.phone || 'No Contact'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30' :
                                            user.role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                                user.role === 'responder' ? 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/30' :
                                                    'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-slate-400'}`}></div>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleStatus(user._id)}
                                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-500 dark:text-slate-400"
                                                title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                                            >
                                                {user.status === 'ACTIVE' ? <ToggleRight size={26} className="text-teal-500" /> : <ToggleLeft size={26} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                {!loading && totalUsers > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Showing <span className="text-slate-900 dark:text-white font-bold">{(page - 1) * 10 + 1} - {Math.min(page * 10, totalUsers)}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalUsers}</span> users
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-9 h-9 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${page === i + 1
                                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                        : 'hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-9 h-9 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals with Classic Design */}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Account</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="Enter full name"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                        placeholder="07xxxxxxxx"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Initial Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">User Assignment</label>
                                <select
                                    name="role"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-white font-medium"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                >
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="responder">Responder</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold mt-4 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                            >
                                Register User Profile
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showDetailModal && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowDetailModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">

                        {/* Modal Header — avatar + identity, no overflow clipping */}
                        <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-lg flex-shrink-0 border-2 border-slate-200 dark:border-slate-700">
                                {selectedUser.avatarUrl ? (
                                    <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <UserIcon size={40} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{selectedUser.name || 'No Name'}</h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${selectedUser.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-900/30' :
                                        selectedUser.role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/30' :
                                            selectedUser.role === 'responder' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-900/30' :
                                                'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/40 dark:text-teal-400 dark:border-teal-900/30'
                                        }`}>
                                        {selectedUser.role}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${selectedUser.status === 'ACTIVE' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {selectedUser.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="self-start p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar pt-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 text-left">
                                <div className="space-y-8">
                                    {/* Primary Info */}
                                    <section>
                                        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity size={14} className="text-teal-500" />
                                            Identity & Contact
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"><Mail size={16} className="text-slate-500" /></div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.email || 'Email not listed'}</span>
                                            </div>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"><Phone size={16} className="text-slate-500" /></div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.phone || 'Phone not listed'}</span>
                                            </div>
                                            {selectedUser.profile?.dob && (
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"><Calendar size={16} className="text-slate-500" /></div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Birth: {new Date(selectedUser.profile.dob).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Patient Profile */}
                                    {selectedUser.role === 'patient' && selectedUser.profile && (
                                        <section>
                                            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <MapPin size={14} className="text-teal-500" />
                                                Medical Registry
                                            </h4>
                                            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                                <p className="text-sm flex justify-between"><strong className="text-slate-500 font-bold">Client ID:</strong> <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedUser.profile.patientId}</span></p>
                                                <p className="text-sm flex justify-between"><strong className="text-slate-500 font-bold">Blood Group:</strong> <span className="font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 rounded-md">{selectedUser.profile.bloodGroup || 'UNK'}</span></p>
                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Residence</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium capitalize">
                                                        {`${selectedUser.profile.address?.line1 || ''}, ${selectedUser.profile.address?.city || ''}, ${selectedUser.profile.address?.district || ''}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Doctor Profile Side A */}
                                    {selectedUser.role === 'doctor' && selectedUser.profile && (
                                        <section>
                                            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <GraduationCap size={14} className="text-teal-500" />
                                                Medical Credentials
                                            </h4>
                                            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                                <p className="text-sm flex justify-between"><strong className="text-slate-500 font-bold">Registry ID:</strong> <span className="font-bold text-slate-900 dark:text-white">{selectedUser.profile.licenseNumber}</span></p>
                                                <p className="text-sm flex justify-between"><strong className="text-slate-500 font-bold">Specialization:</strong> <span className="font-bold text-teal-600 dark:text-teal-400">{selectedUser.profile.specialization}</span></p>
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Award size={12} /> Qualifications</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedUser.profile.qualifications?.map((q, i) => (
                                                            <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">{q}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {/* Doctor Profile Side B */}
                                    {selectedUser.role === 'doctor' && selectedUser.profile && (
                                        <>
                                            <section>
                                                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Briefcase size={14} className="text-teal-500" />
                                                    Professional Experience
                                                </h4>
                                                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">"{selectedUser.profile.bio || 'Professional brief not provided by the doctor.'}"</p>
                                                    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white italic">{selectedUser.profile.experience} Years of Service</span>
                                                        </div>
                                                        <div className="px-4 py-2 bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 rounded-xl text-lg font-black">
                                                            {selectedUser.profile.consultationFee} LKR
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Availability Matrix</h4>
                                                <div className="space-y-2">
                                                    {selectedUser.profile.availabilitySlots?.length > 0 ? selectedUser.profile.availabilitySlots.map((slot, i) => (
                                                        <div key={i} className="flex justify-between items-center px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                                            <span className="text-[10px] font-bold uppercase text-slate-500">{slot.day}</span>
                                                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-tight">{slot.startTime} — {slot.endTime}</span>
                                                        </div>
                                                    )) : (
                                                        <p className="text-xs text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">No indexed availability slots</p>
                                                    )}
                                                </div>
                                            </section>

                                            {/* Recent Reviews Section */}
                                            <section>
                                                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Activity size={14} className="text-teal-500" />
                                                    Recent Reviews
                                                </h4>
                                                <div className="space-y-4">
                                                    {doctorReviews.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic">No reviews found for this doctor.</p>
                                                    ) : doctorReviews.map((r, i) => (
                                                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-emerald-600">{r.rating}★</span>
                                                                <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{r.review}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </>
                                    )}

                                    {/* Patient Analysis */}
                                    {selectedUser.role === 'patient' && selectedUser.profile && (
                                        <section>
                                            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Physiological Data</h4>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-rose-500 uppercase mb-3 tracking-widest">Allergies</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedUser.profile.allergies?.length > 0 ? selectedUser.profile.allergies.map((a, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold">{a}</span>
                                                            )) : <span className="text-xs italic text-slate-400">None Recorded</span>}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                                        <p className="text-[10px] font-bold text-amber-500 uppercase mb-3 tracking-widest">Chronic Nodes</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedUser.profile.chronicConditions?.length > 0 ? selectedUser.profile.chronicConditions.map((c, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold">{c}</span>
                                                            )) : <span className="text-xs italic text-slate-400">None Recorded</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stature</p>
                                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.profile.heightCm}<span className="text-xs text-slate-400 ml-1">cm</span></p>
                                                    </div>
                                                    <div className="text-center border-l border-slate-200 dark:border-slate-800">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mass Index</p>
                                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.profile.weightKg}<span className="text-xs text-slate-400 ml-1">kg</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
