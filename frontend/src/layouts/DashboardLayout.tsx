import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Upload, Target, Github, LogOut,
    User, Award, GitBranch, Settings, Search,
    Bell, Mail, ChevronRight, Zap
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userId = localStorage.getItem('user_id');
    const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', []);

    const [displayName, setDisplayName] = useState<string>('User');
    const [displaySub, setDisplaySub] = useState<string>('');
    const [readiness, setReadiness] = useState<number>(0);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/dashboard/skills', icon: Target, label: 'My Skills' },
        { path: '/dashboard/recommendations', icon: Award, label: 'Learning' },
        { path: '/dashboard/pathways', icon: GitBranch, label: 'Pathways' },
        { path: '/dashboard/github', icon: Github, label: 'GitHub Sync' },
        { path: '/dashboard/upload', icon: Upload, label: 'Analyze Resume' },
    ];

    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`, { signal: controller.signal });
                if (res.status === 401 || res.status === 404) { handleLogout(); return; }
                if (!res.ok) return;
                const data = await res.json();
                setDisplayName(data?.user?.name || data?.user?.username || 'User');
                setDisplaySub(data?.user?.username ? `@${data.user.username}` : 'Student');
                const r =
                    typeof data?.computed_readiness?.readiness_score === 'number'
                        ? data.computed_readiness.readiness_score
                        : data?.latest_analysis?.readiness_score;
                setReadiness(typeof r === 'number' ? r : 0);
            } catch (err) { console.error(err); }
        })();

        return () => controller.abort();
    }, [apiBaseUrl, userId]);

    return (
        <div className="h-screen w-screen bg-[#F8F9FB] flex overflow-hidden font-sans text-[#1A1C1E]">

            {/* COLUMN 1: FIXED SIDEBAR */}
            <aside className="w-72 h-full bg-white border-r border-[#F1F3F5] flex flex-col z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                            <Zap className="text-white h-6 w-6" fill="currentColor" />
                        </div>
                        <span className="text-xl font-black tracking-tight uppercase">SkillGenome</span>
                    </div>

                    <nav className="space-y-2">
                        <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] mb-4 ml-4">Overview</p>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-[#6366F1] text-white shadow-xl shadow-[#6366F1]/20' : 'text-[#718096] hover:bg-[#F8F9FB]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:text-[#6366F1]'}`} />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </div>
                                    {isActive && <motion.div layoutId="pill" className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8 space-y-4">
                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.2em] ml-4">Settings</p>
                    <Link to="/dashboard/profile" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${location.pathname === '/dashboard/profile' ? 'bg-[#F8F9FB] text-[#6366F1]' : 'text-[#718096] hover:bg-[#F8F9FB]'}`}>
                        <Settings className="h-5 w-5" />
                        <span className="text-sm font-bold">Account</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#E53E3E] hover:bg-[#FFF5F5] transition-all font-bold text-sm">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* COLUMN 2: SCROLLABLE MAIN CONTENT */}
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative flex flex-col">
                {/* Sticky Header inside Content area */}
                <header className="sticky top-0 z-10 bg-[#F8F9FB]/80 backdrop-blur-md p-8 flex items-center justify-between">
                    <div className="relative w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A0AEC0] group-focus-within:text-[#6366F1] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search your career DNA..."
                            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#6366F1]/10 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all text-[#718096]">
                            <Mail className="h-5 w-5" />
                        </button>
                        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md transition-all text-[#718096] relative">
                            <Bell className="h-5 w-5" />
                            <div className="absolute top-3 right-3 w-2 h-2 bg-[#6366F1] rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <section className="px-8 pb-12">
                    <Outlet />
                </section>
            </main>

            {/* COLUMN 3: PERSISTENT STATS PANEL */}
            <aside className="w-80 h-full bg-white border-l border-[#F1F3F5] p-8 hidden xl:flex flex-col z-20">
                <div className="flex items-center justify-end gap-4 mb-10">
                    <div className="text-right">
                        <p className="text-sm font-black text-[#1A1C1E]">{displayName}</p>
                        <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">{displaySub}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center text-white shadow-lg">
                        <User className="h-6 w-6" />
                    </div>
                </div>

                <div className="glass-panel p-6 text-center mb-8 bg-[#F8F9FB]/50 border-none">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#718096] mb-6">Statistic</h3>
                    <div className="relative inline-flex items-center justify-center mb-6">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#EDF2F7" strokeWidth="12" fill="transparent" />
                            <circle
                                cx="80" cy="80" r="70" stroke="#6366F1" strokeWidth="12" fill="transparent"
                                strokeDasharray={440} strokeDashoffset={440 - (440 * (readiness || 0)) / 100}
                                strokeLinecap="round" className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black text-[#1A1C1E]">{Math.round(readiness)}%</span>
                            <span className="text-[10px] font-bold text-[#A0AEC0] uppercase">Readiness</span>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-[#4A5568] leading-relaxed">
                        Good Morning, {displayName}! <br />
                        <span className="text-[#A0AEC0] font-medium text-xs">Continue your journey to reach your target.</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#718096]">Top Mentors</h3>
                        <button className="w-8 h-8 rounded-xl bg-[#F8F9FB] flex items-center justify-center text-[#6366F1] font-bold">+</button>
                    </div>
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] flex items-center justify-center text-[#718096]">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black">AI Advisor v{i}.0</p>
                                    <p className="text-[10px] text-[#A0AEC0] font-bold">Career Expert</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#CBD5E0] group-hover:text-[#6366F1] transition-colors" />
                        </div>
                    ))}
                </div>
            </aside>

        </div>
    );
};

export default DashboardLayout;