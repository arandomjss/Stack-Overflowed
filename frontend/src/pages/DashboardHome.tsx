import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award } from 'lucide-react';

const DashboardHome: React.FC = () => {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
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
                            <p className="text-2xl font-bold">0</p>
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
                            <p className="text-2xl font-bold">--</p>
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
                            <Award className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-sm text-secondary">Courses Suggested</p>
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
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Review Your Skills</h3>
                            <p className="text-secondary text-sm">See what skills we detected and their confidence scores</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Get Personalized Recommendations</h3>
                            <p className="text-secondary text-sm">Receive course suggestions to bridge your skill gaps</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardHome;
