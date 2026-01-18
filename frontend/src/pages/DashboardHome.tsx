import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Github } from 'lucide-react';

const DashboardHome: React.FC = () => {
    const apiBaseUrl = useMemo(
        () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
        []
    );

    const [skillsTracked, setSkillsTracked] = useState<number | null>(null);
    const [projectsImported, setProjectsImported] = useState<number | null>(null);
    const [readinessScore, setReadinessScore] = useState<number | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            setSkillsTracked(0);
            setProjectsImported(0);
            setReadinessScore(null);
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`, { signal: controller.signal });
                if (res.status === 401 || res.status === 404) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_id');
                    window.location.assign('/');
                    return;
                }
                if (!res.ok) {
                    setSkillsTracked(0);
                    setProjectsImported(0);
                    setReadinessScore(null);
                    return;
                }

                const data = await res.json();

                const name = data?.user?.name ? String(data.user.name) : null;
                const username = data?.user?.username ? String(data.user.username) : null;
                setDisplayName(name || username);

                const skillsCount = Array.isArray(data?.skills) ? data.skills.length : 0;
                const projectsCount = Array.isArray(data?.projects) ? data.projects.length : 0;
                const readiness =
                    typeof data?.latest_analysis?.readiness_score === 'number'
                        ? data.latest_analysis.readiness_score
                        : null;

                setSkillsTracked(skillsCount);
                setProjectsImported(projectsCount);
                setReadinessScore(readiness);
            } catch {
                setSkillsTracked(0);
                setProjectsImported(0);
                setReadinessScore(null);
            }
        })();

        return () => controller.abort();
    }, [apiBaseUrl]);

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-bold mb-2">
                    {displayName ? `Welcome Back, ${displayName}!` : 'Welcome Back!'}
                </h1>
                <p className="text-secondary">Track your skills and accelerate your career growth</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{skillsTracked ?? '—'}</p>
                            <p className="text-sm text-secondary">Skills Tracked</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {readinessScore == null ? '—' : `${Math.round(readinessScore)}%`}
                            </p>
                            <p className="text-sm text-secondary">Readiness Score</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Github className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{projectsImported ?? '—'}</p>
                            <p className="text-sm text-secondary">Projects Imported</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel p-8"
            >
                <h2 className="text-2xl font-bold mb-4">Get Started</h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">1</span>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Upload Your Resume</h3>
                            <p className="text-secondary text-sm">Let our AI extract your skills automatically</p>
                            <Link
                                to="/dashboard/upload"
                                className="inline-block mt-2 text-sm text-primary hover:underline"
                            >
                                Go to Resume Upload
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Import Your GitHub</h3>
                            <p className="text-secondary text-sm">Pull your repos and infer skills from languages</p>
                            <Link
                                to="/dashboard/github"
                                className="inline-block mt-2 text-sm text-primary hover:underline"
                            >
                                Go to GitHub Import
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Get Personalized Recommendations</h3>
                            <p className="text-secondary text-sm">See your gaps and next steps for a target role</p>
                            <Link
                                to="/dashboard/recommendations"
                                className="inline-block mt-2 text-sm text-primary hover:underline"
                            >
                                Go to Recommendations
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardHome;
