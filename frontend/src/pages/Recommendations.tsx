import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Youtube, ExternalLink, Filter,
  Clock, CheckCircle, Sparkles, Target, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Course { platform: string; title: string; url: string; }
interface Video { title: string; channel: string; url: string; duration: string; }

interface Recommendation {
  skill_name: string;
  phase: string;
  priority: 'high' | 'medium' | 'low';
  courses: Course[];
  videos: Video[];
  reason: string;
}

interface RecommendationsData {
  readiness_score: number;
  target_role: string;
  recommendations: Recommendation[];
  summary: {
    total_skills_needed: number;
    current_skills: number;
    courses_available: number;
    videos_available: number;
  };
}

const Recommendations: React.FC = () => {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const navigate = useNavigate();

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', []);

  useEffect(() => {
    const loadRecommendations = async () => {
      setError(null);
      try {
        const storedSkills = localStorage.getItem('userSkills');
        const storedTargetRole = localStorage.getItem('targetRole');
        const userId = localStorage.getItem('user_id');

        const normalizeSkills = (raw: any): Array<{ name: string; confidence?: number }> => {
          if (!Array.isArray(raw)) return [];
          return raw
            .map((s: any) => {
              if (typeof s === 'string') return { name: s };
              const name = s?.name || s?.skill_name || s?.skill;
              if (!name) return null;
              const confidence = typeof s?.confidence === 'number' ? s.confidence : undefined;
              return { name: String(name), confidence };
            })
            .filter(Boolean) as Array<{ name: string; confidence?: number }>;
        };

        let skills = storedSkills ? normalizeSkills(JSON.parse(storedSkills)) : [];
        let targetRole = storedTargetRole || 'software engineer';

        // If localStorage skills are missing, fall back to profile as the source of truth.
        if ((!skills || skills.length === 0) && userId) {
          const profileRes = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
          if (profileRes.status === 401 || profileRes.status === 404) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            navigate('/');
            return;
          }

          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            skills = normalizeSkills(
              (profileJson?.skills || []).map((s: any) => ({
                name: s?.skill_name,
                confidence: s?.confidence,
              }))
            );

            targetRole =
              profileJson?.computed_readiness?.target_role ||
              profileJson?.user?.target_role ||
              targetRole;

            // Keep localStorage in sync for downstream pages.
            localStorage.setItem('userSkills', JSON.stringify(skills));
            localStorage.setItem('targetRole', String(targetRole));
          }
        }

        if (!skills || skills.length === 0) {
          setData(null);
          setError('Add skills (Resume/GitHub) to generate learning recommendations.');
          return;
        }

        const response = await fetch(`${apiBaseUrl}/api/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills, target_role: targetRole }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load recommendations');
        }

        setData(await response.json());
      } catch (err) {
        console.error(err);
        setData(null);
        setError('Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, [apiBaseUrl]);

  const filteredRecs = useMemo(() => {
    return data?.recommendations.filter(r =>
      (selectedPhase === 'all' || r.phase === selectedPhase) &&
      (selectedPriority === 'all' || r.priority === selectedPriority)
    ) || [];
  }, [data, selectedPhase, selectedPriority]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Zap className="h-10 w-10 text-[#6366F1]" />
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="px-4">
        <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight mb-1">Learning HQ</h1>
        <p className="text-[#A0AEC0] font-bold text-[10px] uppercase tracking-widest">Personalized intelligence to reach your career peak</p>
      </div>

      {error && (
        <div className="mx-4 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 text-xs font-black uppercase tracking-tight">
          {error}
        </div>
      )}

      {/* READINESS BENTO BANNER */}
      {data && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="mx-4 p-8 rounded-[2.5rem] bg-white shadow-xl shadow-[#6366F1]/5 flex flex-col md:flex-row items-center gap-10"
        >
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="#F1F3F5" strokeWidth="10" fill="transparent" />
              <motion.circle
                cx="64" cy="64" r="58" stroke="#6366F1" strokeWidth="10" fill="transparent"
                strokeDasharray={364} initial={{ strokeDashoffset: 364 }}
                animate={{ strokeDashoffset: 364 - (364 * data.readiness_score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[#1A1C1E]">{data.readiness_score}%</span>
              <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-tighter">Readiness</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Target Role', val: data.target_role, sub: 'Optimized Path' },
              { label: 'Skills Needed', val: data.summary.total_skills_needed, sub: 'Genome Gaps' },
              { label: 'Courses', val: data.summary.courses_available, sub: 'Verified Links' },
              { label: 'Tutorials', val: data.summary.videos_available, sub: 'Quick Learning' },
            ].map((stat, i) => (
              <div key={i} className="border-l border-[#F1F3F5] pl-6 first:border-none">
                <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-lg font-black text-[#1A1C1E] truncate">{stat.val}</p>
                <p className="text-[9px] font-bold text-[#6366F1] uppercase">{stat.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TACTILE FILTERS */}
      <div className="px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#A0AEC0]" />
            <span className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Phases</span>
          </div>
          <div className="flex gap-2">
            {['all', 'foundation', 'core', 'advanced', 'projects'].map(p => (
              <button
                key={p} onClick={() => setSelectedPhase(p)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${selectedPhase === p ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/20' : 'bg-white text-[#718096] hover:bg-[#F1F3F5]'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#A0AEC0]" />
            <span className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Priority</span>
          </div>
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map(p => (
              <button
                key={p} onClick={() => setSelectedPriority(p)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${selectedPriority === p ? 'bg-[#1A1C1E] text-white' : 'bg-white text-[#718096] hover:bg-[#F1F3F5]'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS GRID */}
      <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredRecs.map((rec, idx) => (
            <motion.div
              key={rec.skill_name} layout initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel p-8 bg-white group hover:shadow-2xl transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase mb-3 ${rec.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                    }`}>
                    <Sparkles className="h-3 w-3" /> {rec.priority} Priority
                  </div>
                  <h3 className="text-xl font-black text-[#1A1C1E]">{rec.skill_name}</h3>
                  <p className="text-xs text-[#A0AEC0] font-medium mt-1">{rec.reason}</p>
                </div>
                <span className="bg-[#F8F9FB] text-[#718096] text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter">
                  {rec.phase} phase
                </span>
              </div>

              <div className="space-y-6">
                {/* Courses */}
                {rec.courses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 ml-1">
                      <BookOpen className="h-3.5 w-3.5 text-[#6366F1]" />
                      <span className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Learning Modules</span>
                    </div>
                    <div className="space-y-2">
                      {rec.courses.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" className="flex items-center justify-between p-4 bg-[#F8F9FB] rounded-2xl hover:bg-[#EEF2FF] transition-all group/link">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#1A1C1E] truncate">{c.title}</p>
                            <p className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-tighter">{c.platform}</p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[#CBD5E0] group-hover/link:text-[#6366F1] transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {rec.videos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 ml-1">
                      <Youtube className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Video Tutorials</span>
                    </div>
                    <div className="space-y-2">
                      {rec.videos.map((v, i) => (
                        <a key={i} href={v.url} target="_blank" className="flex items-center justify-between p-4 bg-[#F8F9FB] rounded-2xl hover:bg-[#FFF5F5] transition-all group/video">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm"><Zap className="h-3.5 w-3.5" fill="currentColor" /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-[#1A1C1E] truncate">{v.title}</p>
                              <div className="flex items-center gap-2 text-[9px] font-bold text-[#A0AEC0] uppercase">
                                <span>{v.channel}</span>
                                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {v.duration}</span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-[#CBD5E0] group-hover/video:text-rose-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRecs.length === 0 && (
        <div className="text-center py-20 px-4">
          <CheckCircle className="h-12 w-12 text-[#6366F1] mx-auto mb-4 opacity-20" />
          <p className="text-sm font-black text-[#718096] uppercase tracking-widest">No matching insights found</p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;