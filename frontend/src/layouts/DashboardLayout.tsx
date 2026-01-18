import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Upload, Target, Github, LogOut, User, Award, GitBranch } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userId = localStorage.getItem('user_id');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Home' },
        { path: '/dashboard/upload', icon: Upload, label: 'Upload Resume' },
        { path: '/dashboard/skills', icon: Target, label: 'My Skills' },
        { path: '/dashboard/recommendations', icon: Award, label: 'Recommendations' },
        { path: '/dashboard/github', icon: Github, label: 'GitHub' },
        { path: '/dashboard/pathways', icon: GitBranch, label: 'Career Pathways' },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                className="w-64 bg-surface/50 backdrop-blur-lg border-r border-white/10 p-6"
            >
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                        SkillGenome
                    </h1>
                    <p className="text-secondary text-sm mt-1">Career Architect</p>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-primary/20 text-primary'
                                        : 'text-secondary hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="glass-panel p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-secondary truncate">{userId?.slice(0, 8)}...</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
