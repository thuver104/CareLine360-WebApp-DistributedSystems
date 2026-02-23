import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, ToggleLeft, ToggleRight, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.data);
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
                u._id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
            ));
            toast.success('User status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredUsers = users.filter(user => {
        const name = user.name || '';
        const email = user.email || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                    <p className="text-slate-500">Manage patients, doctors, and responders</p>
                </div>
            </div>

            <div className="glass-card p-4 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 border rounded-xl bg-white outline-none appearance-none pr-8 relative"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="patient">Patients</option>
                            <option value="doctor">Doctors</option>
                            <option value="responder">Responders</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-slate-500 text-sm">
                                <th className="pb-4 font-bold px-4">USER</th>
                                <th className="pb-4 font-bold px-4">ROLE</th>
                                <th className="pb-4 font-bold px-4">STATUS</th>
                                <th className="pb-4 font-bold px-4 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                <UserIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 uppercase text-xs font-bold tracking-wider">
                                        <span className={`px-2 py-1 rounded-md ${user.role === 'admin' ? 'bg-red-50 text-red-600' :
                                            user.role === 'doctor' ? 'bg-blue-50 text-blue-600' :
                                                user.role === 'responder' ? 'bg-purple-50 text-purple-600' :
                                                    'bg-green-50 text-green-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${user.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(user._id)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                                        >
                                            {user.status === 'active' ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            No users found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
