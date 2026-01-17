import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader, CheckCircle, Target, AlertCircle, Briefcase } from 'lucide-react';

interface Skill {
    name: string;
    confidence: number;
}

interface RoadmapPhase {
    phase: string;
    skills: Array<{
        name: string;
        courses: Array<{
            platform: string;
            title: string;
            url: string;
        }>;
    }>;
}

interface Recommendation {
    skill: string;
    confidence: number;
    courses: Array<{ platform: string; title: string; url: string }>;
    source: 'confidence' | 'gap';
    reason?: string;
}

const ResumeUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [roles, setRoles] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const userId = localStorage.getItem('user_id');

    // Fetch available roles on component mount
    React.useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/roles');
                const data = await response.json();
                if (response.ok && data.roles) {
                    setRoles(data.roles);
                    if (data.roles.length > 0) {
                        setSelectedRole(data.roles[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/resume/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                const initialSkills = (data.skills || []).map((skill: Skill) => ({
                    ...skill,
                    confidence: 0.5
                }));
                setSkills(initialSkills);
                setRoadmap(data.roadmap || []);
                setShowRecommendations(false);
            } else {
                alert(`Error: ${data.error || 'Failed to analyze resume'}`);
            }
        } catch (error) {
            alert(`Network error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSkillChange = (index: number, newConfidence: number) => {
        const updatedSkills = [...skills];
        updatedSkills[index].confidence = newConfidence / 100;
        setSkills(updatedSkills);
    };

    const getRecommendations = async () => {
        const weakSkills = skills
            .filter(skill => skill.confidence < 0.7)
            .sort((a, b) => a.confidence - b.confidence);

        const confidenceBasedRecs: Recommendation[] = [];

        weakSkills.forEach(weakSkill => {
            roadmap.forEach(phase => {
                phase.skills.forEach(roadmapSkill => {
                    if (roadmapSkill.name.toLowerCase() === weakSkill.name.toLowerCase()) {
                        confidenceBasedRecs.push({
                            skill: weakSkill.name,
                            confidence: weakSkill.confidence,
                            courses: roadmapSkill.courses,
                            source: 'confidence'
                        });
                    }
                });
            });
        });

        let gapAnalysisRecs: Recommendation[] = [];

        if (userId && selectedRole) {
            try {
                const response = await fetch(`http://localhost:5000/api/gap-analysis/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_role: selectedRole,
                        target_sector: 'Technology',
                        skills: skills.map(s => ({ name: s.name, confidence: s.confidence }))
                    })
                });

                const data = await response.json();
                if (response.ok && data.recommendations) {
                    data.recommendations.forEach((rec: any) => {
                        const skillConfidence = skills.find(s => s.name.toLowerCase() === rec.skill.toLowerCase())?.confidence || 0;
                        gapAnalysisRecs.push({
                            skill: rec.skill,
                            confidence: skillConfidence,
                            courses: rec.courses || [],
                            source: 'gap',
                            reason: rec.reason || 'Required for target role'
                        });
                    });
                }
            } catch (error) {
                console.error('Gap analysis failed:', error);
            }
        }

        const allRecs = [...gapAnalysisRecs, ...confidenceBasedRecs];
        const uniqueRecs = allRecs.filter((rec, index, self) =>
            index === self.findIndex(r => r.skill.toLowerCase() === rec.skill.toLowerCase())
        );

        setRecommendations(uniqueRecs);
    };

    const weakSkillsCount = skills.filter(s => s.confidence < 0.7).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold mb-2">Upload Resume</h1>
                <p className="text-secondary">Extract skills, select your target role, and get personalized recommendations</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8"
            >
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50'
                        }`}
                >
                    {!file ? (
                        <>
                            <Upload className="h-16 w-16 mx-auto mb-4 text-secondary" />
                            <h3 className="text-xl font-semibold mb-2">Drop your resume here</h3>
                            <p className="text-secondary mb-4">or click to browse</p>
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-block px-6 py-3 bg-primary/20 hover:bg-primary/30 rounded-lg cursor-pointer transition-all"
                            >
                                Select File
                            </label>
                            <p className="text-xs text-secondary mt-4">Supports PDF and DOCX</p>
                        </>
                    ) : (
                        <div className="flex items-center justify-center gap-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                                <p className="font-semibold">{file.name}</p>
                                <p className="text-sm text-secondary">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="ml-4 text-red-400 hover:text-red-300"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                {file && !loading && skills.length === 0 && (
                    <button
                        onClick={handleUpload}
                        className="w-full mt-6 btn-primary"
                    >
                        Extract Skills
                    </button>
                )}

                {loading && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-primary">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Extracting skills from your resume...</span>
                    </div>
                )}
            </motion.div>

            {skills.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="h-6 w-6 text-violet-400" />
                        <h2 className="text-xl font-bold">Target Role</h2>
                    </div>
                    <p className="text-secondary mb-4">Select the role you want to pursue</p>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-white/20 rounded-lg text-white focus:border-primary focus:outline-none"
                    >
                        {roles.map((role) => (
                            <option key={role} value={role} className="bg-background">
                                {role}
                            </option>
                        ))}
                    </select>
                </motion.div>
            )}

            {skills.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                            <h2 className="text-2xl font-bold">Rate Your Skills ({skills.length})</h2>
                        </div>
                        {weakSkillsCount > 0 && (
                            <div className="flex items-center gap-2 text-orange-400">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm">{weakSkillsCount} skills need improvement</span>
                            </div>
                        )}
                    </div>
                    <p className="text-secondary mb-6">Adjust the sliders to rate your proficiency (0-100%)</p>

                    <div className="space-y-4">
                        {skills.map((skill, idx) => (
                            <div key={idx} className="bg-surface/50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold">{skill.name}</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={Math.round(skill.confidence * 100)}
                                            onChange={(e) => handleSkillChange(idx, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 bg-background rounded text-center text-sm"
                                        />
                                        <span className="text-sm text-secondary">%</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skill.confidence * 100}
                                    onChange={(e) => handleSkillChange(idx, parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, 
                      ${skill.confidence < 0.3 ? '#ef4444' : skill.confidence < 0.7 ? '#f59e0b' : '#10b981'} 0%, 
                      ${skill.confidence < 0.3 ? '#ef4444' : skill.confidence < 0.7 ? '#f59e0b' : '#10b981'} ${skill.confidence * 100}%, 
                      rgba(255,255,255,0.1) ${skill.confidence * 100}%, 
                      rgba(255,255,255,0.1) 100%)`
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={async () => {
                            setLoading(true);
                            await getRecommendations();
                            setShowRecommendations(true);
                            setLoading(false);
                        }}
                        disabled={loading}
                        className="w-full mt-6 btn-primary flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Get Course Recommendations'
                        )}
                    </button>
                </motion.div>
            )}

            {showRecommendations && recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="h-6 w-6 text-violet-400" />
                        <h2 className="text-2xl font-bold">Recommended Courses</h2>
                    </div>

                    {recommendations.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                            <p className="text-lg font-semibold mb-2">Great job!</p>
                            <p className="text-secondary">All your skills are rated above 70%. Keep up the excellent work!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-secondary">Focus on these skills to improve your profile:</p>
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className={`border-l-4 pl-6 ${rec.source === 'gap' ? 'border-violet-500' : 'border-orange-500'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold">{rec.skill}</h3>
                                            {rec.reason && (
                                                <p className="text-sm text-secondary mt-1">{rec.reason}</p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${rec.confidence < 0.3 ? 'bg-red-500/20 text-red-400' :
                                            rec.confidence < 0.5 ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {Math.round(rec.confidence * 100)}% proficiency
                                        </span>
                                    </div>

                                    {rec.courses.length > 0 ? (
                                        <div className="space-y-2">
                                            {rec.courses.map((course, courseIdx) => (
                                                <a
                                                    key={courseIdx}
                                                    href={course.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-4 bg-surface/50 hover:bg-surface/70 rounded-lg transition-all"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{course.title}</p>
                                                            <p className="text-sm text-secondary mt-1">{course.platform}</p>
                                                        </div>
                                                        <span className="text-primary">→</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-secondary text-sm">No courses available for this skill yet.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default ResumeUpload;
