import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyChamas, createChama } from '../api/chamas';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChamaSelect() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [chamas, setChamas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        contributionAmount: '',
        meetingFrequency: 'monthly',
        defaultLoanInterestRate: 10,
    });

    useEffect(() => {
        fetchMyChamas()
            .then(res => setChamas(res.data.chamas))
            .catch(() => toast.error('Failed to load your chamas'))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await createChama({
                ...form,
                contributionAmount: parseInt(form.contributionAmount, 10),
                defaultLoanInterestRate: parseFloat(form.defaultLoanInterestRate) / 100,
            });
            toast.success('Chama created!');
            navigate(`/chamas/${res.data.chama._id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create chama');
        } finally {
            setSubmitting(false);
        }
    };

    const roleColors = {
        chairman: 'bg-amber-100 text-amber-800',
        treasurer: 'bg-blue-100 text-blue-800',
        member: 'bg-gray-100 text-gray-600',
    };

    const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-[#F8F6F3] flex flex-col">
            {/* Top bar */}
            <header className="bg-[#1C1814] px-8 py-4 flex items-center justify-between">
                <div>
                    <span className="font-serif text-xl text-amber-500">ChamaLedger</span>
                    <span className="block text-[9px] text-white/30 tracking-widest uppercase mt-0.5">
                        Financial Transparency
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/60 text-sm">{user?.email}</span>
                    <button
                        onClick={logout}
                        className="text-white/40 hover:text-white/80 text-sm transition"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-lg">
                    {/* Greeting */}
                    <div className="text-center mb-10">
                        <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                            {initials(user?.name)}
                        </div>
                        <h1 className="font-serif text-3xl text-[#1C1814] mb-1">
                            Karibu, {user?.name?.split(' ')[0]}
                        </h1>
                        <p className="text-[#6B6560] text-sm">
                            Chagua kikundi chako / Select your chama
                        </p>
                    </div>

                    {/* Chama list */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-20 bg-white border border-[#E8E4DF] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : chamas.length === 0 ? (
                        <div className="text-center py-12 bg-white border border-[#E8E4DF] rounded-xl">
                            <div className="text-4xl mb-4">🏦</div>
                            <p className="font-semibold text-[#1C1814] mb-1">No chamas yet</p>
                            <p className="text-sm text-[#6B6560] mb-6">
                                You are not a member of any chama. Create one to get started.
                            </p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
                            >
                                Create Your First Chama
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {chamas.map((chama, i) => (
                                <button
                                    key={chama._id}
                                    onClick={() => navigate(`/chamas/${chama._id}`)}
                                    className={`w-full text-left bg-white border rounded-xl px-5 py-4 flex items-center justify-between hover:border-amber-400 hover:bg-amber-50/50 transition group ${i === 0 ? 'border-amber-400 border-2' : 'border-[#E8E4DF]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
                                            {initials(chama.name)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[#1C1814] text-[15px]">
                                                {chama.name}
                                            </div>
                                            <div className="text-xs text-[#6B6560] mt-0.5">
                                                KES {chama.contributionAmount?.toLocaleString()}/month
                                                {chama.memberCount && ` · ${chama.memberCount} members`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleColors[chama.myRole] || roleColors.member}`}>
                                            {chama.myRole}
                                        </span>
                                        <span className="text-[#9E9690] group-hover:text-amber-600 transition">→</span>
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full border border-dashed border-[#E8E4DF] rounded-xl px-5 py-4 text-sm text-[#9E9690] hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30 transition text-center font-medium"
                            >
                                + Unda Kikundi Kipya / Create New Chama
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create modal */}
            {showCreate && (
                <div
                    className="fixed inset-0 bg-[#1C1814]/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="font-serif text-2xl text-[#1C1814] mb-1">Unda Kikundi</h2>
                        <p className="text-sm text-[#6B6560] mb-6">Create a new chama</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#1C1814] mb-1.5">
                                    Chama Name *
                                </label>
                                <input
                                    className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="e.g. Kilimani Savings Group"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#1C1814] mb-1.5">
                                    Monthly Contribution (KES) *
                                </label>
                                <input
                                    type="number"
                                    className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="5000"
                                    min="1"
                                    step="1"
                                    value={form.contributionAmount}
                                    onChange={e => setForm(f => ({ ...f, contributionAmount: e.target.value }))}
                                    required
                                />
                                <p className="text-xs text-[#9E9690] mt-1">Whole numbers only</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#1C1814] mb-1.5">
                                        Meeting Frequency
                                    </label>
                                    <select
                                        className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        value={form.meetingFrequency}
                                        onChange={e => setForm(f => ({ ...f, meetingFrequency: e.target.value }))}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#1C1814] mb-1.5">
                                        Default Loan Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                        value={form.defaultLoanInterestRate}
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        onChange={e => setForm(f => ({ ...f, defaultLoanInterestRate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#1C1814] mb-1.5">
                                    Description (optional)
                                </label>
                                <input
                                    className="w-full h-10 px-3 border border-[#E8E4DF] rounded-lg text-sm focus:outline-none focus:border-amber-500"
                                    placeholder="Brief description of your chama"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-amber-600 text-white h-10 rounded-lg font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Creating...' : 'Create Chama'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-5 border border-[#E8E4DF] text-[#6B6560] h-10 rounded-lg text-sm hover:bg-[#F8F6F3] transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}