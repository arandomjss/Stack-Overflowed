import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Target, Award, Loader, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserSkill {
    id: number;
    skill_name: string;
    confidence: number;
    sector_context: string;
    source: string;
}

const Skills: React.FC = () => {
    const apiBaseUrl = useMemo(
        () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
        []
    );

    const navigate = useNavigate();
    const [skills, setSkills] = useState<UserSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newSkill, setNewSkill] = useState({ name: '', confidence: 50 });
    const userId = localStorage.getItem('user_id');

    const forceLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/');
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills`);
            if (response.status === 401 || response.status === 404) {
                forceLogout();
                return;
            }
            const data = await response.json();
            if (response.ok) {
                setSkills(data.skills || []);
            }
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkill.name || !userId) return;

        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: [{
                        skill_name: newSkill.name,
                        confidence: newSkill.confidence / 100,
                        source: 'manual'
                    }]
                })
            });

            if (response.status === 401 || response.status === 404) {
                forceLogout();
                return;
            }

            if (response.ok) {
                await fetchSkills();
                setNewSkill({ name: '', confidence: 50 });
                setIsAdding(false);
            }
        } catch (error) {
            console.error('Failed to add skill:', error);
        }
    };

    const handleUpdateConfidence = async (skillId: number, confidence: number) => {
        if (!userId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/${skillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confidence: confidence / 100 })
            });

            if (response.status === 401 || response.status === 404) {
                forceLogout();
                return;
            }

            if (response.ok) {
                setSkills(skills.map(s => s.id === skillId ? { ...s, confidence: confidence / 100 } : s));
            }
        } catch (error) {
            console.error('Failed to update confidence:', error);
        }
    };

    const handleDeleteSkill = async (skillId: number) => {
        if (!userId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/${skillId}`, {
                method: 'DELETE'
            });

            if (response.status === 401 || response.status === 404) {
                forceLogout();
                return;
            }

            if (response.ok) {
                setSkills(skills.filter(s => s.id !== skillId));
            }
        } catch (error) {
            console.error('Failed to delete skill:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold mb-2">My Skill Genome</h1>
                    <p className="text-secondary">Visualize and manage your professional DNA</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add New Skill</span>
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleAddSkill} className="glass-panel p-6 flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Skill Name</label>
                                <input
                                    type="text"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-white/20 rounded-lg focus:border-primary focus:outline-none"
                                    placeholder="e.g. React, Python, UI Design"
                                    required
                                />
                            </div>
                            <div className="w-48">
                                <label className="block text-sm font-medium mb-2">Confidence ({newSkill.confidence}%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newSkill.confidence}
                                    onChange={(e) => setNewSkill({ ...newSkill, confidence: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <button type="submit" className="btn-primary">Add Skill</button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-secondary hover:text-white"
                            >
                                Cancel
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {skills.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                    <Award className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold mb-2">No skills added yet</h3>
                    <p className="text-secondary mb-6">Upload your resume to extract skills automatically or add them manually.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map((skill) => (
                        <motion.div
                            key={skill.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-6 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${skill.confidence > 0.7 ? 'bg-green-500/20 text-green-400' :
                                        skill.confidence > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{skill.skill_name}</h3>
                                        <p className="text-xs text-secondary capitalize">Source: {skill.source}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    className="p-2 text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-secondary">Expertise</span>
                                        <span className="font-medium">{Math.round(skill.confidence * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={skill.confidence * 100}
                                        onChange={(e) => handleUpdateConfidence(skill.id, parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #6366f1 ${skill.confidence * 100}%, rgba(255,255,255,0.1) ${skill.confidence * 100}%)`
                                        }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-secondary flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                    </div>
                                    {skill.sector_context && (
                                        <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-secondary truncate">
                                            {skill.sector_context}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Skills;
