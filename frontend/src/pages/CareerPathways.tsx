import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2,
  RefreshCcw, Target, ChevronRight, BookOpen, ExternalLink, Zap, X
} from 'lucide-react';

// --- Types synchronized with pathways.py backend ---
type Course = { platform: string; title: string; url: string; };

type PathwaySkill = {
  name: string;
  status: 'complete' | 'weak' | 'missing';
  confidence: number | null;
  evidence: string[];
  courses: Course[];
};

type PathwayPhase = {
  phase: 'foundation' | 'core' | 'advanced' | 'projects' | string;
  skills: PathwaySkill[];
};

type SuggestedRole = {
  role: string;
  fit_score: number;
  matched_required: number;
  total_required: number;
  projected_readiness_score?: number;
};

type PathwaysResponse = {
  user_id: string;
  target_sector: string;
  target_role: string;
  available_roles: string[];
  stats: {
    readiness_score: number;
    skills_complete: number;
    skills_weak: number;
    skills_missing: number;
  };
  pathway: { phases: PathwayPhase[]; };
  suggested_roles: SuggestedRole[];
};

const PHASE_LABELS: Record<string, string> = {
  foundation: 'Milestone 01: Foundation',
  core: 'Milestone 02: Core Competencies',
  advanced: 'Milestone 03: Advanced Expertise',
  projects: 'Milestone 04: Real-world Application'
};

const CareerPathways: React.FC = () => {
  const apiBaseUrl = useMemo(
    () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
    []
  );
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const [data, setData] = useState<PathwaysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<{ skill: PathwaySkill; phase: string; } | null>(null);

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const fetchTree = async (role?: string) => {
    if (!userId) {
      setError('Missing user_id. Please log in again.');
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const url = new URL(`${apiBaseUrl}/api/pathways/tree`);
      url.searchParams.set('user_id', userId);
      if (role) url.searchParams.set('target_role', role);

      const res = await fetch(url.toString());
      if (res.status === 401 || res.status === 404) {
        forceLogout();
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load pathways');
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="relative">
        <div className="h-16 w-16 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin"></div>
        <Zap className="absolute inset-0 m-auto h-6 w-6 text-[#6366F1] animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 font-sans text-[#1A1C1E]">

      {/* HEADER & MISSION CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Career Roadmap</h1>
          <p className="text-[#A0AEC0] font-bold text-xs uppercase tracking-widest">
            Optimizing DNA Path for {data?.target_role}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleOverride}
            onChange={(e) => {
              setRoleOverride(e.target.value);
              fetchTree(e.target.value);
            }}
            className="bg-white border-none shadow-sm rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#6366F1]/20 min-w-[240px] cursor-pointer"
          >
            <option value="">Switch Career Path</option>
            {data?.available_roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchTree(roleOverride || undefined)}
            className="p-4 bg-white rounded-2xl shadow-sm hover:bg-[#F8F9FB] transition-all text-[#718096]"
            title="Refresh roadmap"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* READINESS RIBBON */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 p-8 rounded-[2.5rem] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-xl shadow-[#6366F1]/20 flex flex-col md:flex-row items-center gap-10"
        >
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">Current Readiness</p>
            <h2 className="text-5xl font-black leading-none">{Math.round(data.stats.readiness_score)}%</h2>
          </div>
          <div className="flex-1 hidden md:grid grid-cols-3 gap-6 border-l border-white/20 pl-10">
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 mb-1">Complete</p>
              <p className="text-xl font-black">{data.stats.skills_complete}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 mb-1">Developing</p>
              <p className="text-xl font-black">{data.stats.skills_weak}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 mb-1">Missing</p>
              <p className="text-xl font-black">{data.stats.skills_missing}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/recommendations')}
            className="bg-white text-[#6366F1] px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            Accelerate Path
          </button>
        </motion.div>
      )}

      {error && (
        <div className="mx-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-xs font-black uppercase tracking-tight">
          {error}
        </div>
      )}

      {/* SEQUENTIAL ROADMAP PHASES */}
      <div className="px-4 space-y-12 relative">
        <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-[#F1F3F5] -z-10 hidden lg:block" />

        {data?.pathway.phases.map((phase, pIdx) => (
          <div key={phase.phase} className="relative">
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${phase.skills.every(s => s.status === 'complete') ? 'bg-emerald-500' : 'bg-[#1A1C1E]'
                }`}>
                {pIdx + 1}
              </div>
              <h3 className="text-xl font-black tracking-tight">
                {PHASE_LABELS[phase.phase] || phase.phase}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-0 lg:ml-16">
              {phase.skills.map((skill) => (
                <motion.div
                  key={skill.name}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedSkill({ skill, phase: phase.phase })}
                  className={`cursor-pointer p-5 rounded-[2rem] bg-white border-2 transition-all flex items-center justify-between group ${skill.status === 'complete' ? 'border-emerald-100 bg-emerald-50/30' : 'border-[#F8F9FB] hover:border-[#6366F1]/20 shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${skill.status === 'complete' ? 'bg-emerald-500 text-white' :
                        skill.status === 'weak' ? 'bg-amber-500 text-white' : 'bg-[#F8F9FB] text-[#CBD5E0]'
                      }`}>
                      {skill.status === 'complete' ? <CheckCircle2 className="h-5 w-5" /> :
                        skill.status === 'weak' ? <AlertTriangle className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{skill.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${skill.status === 'complete' ? 'text-emerald-500' :
                          skill.status === 'weak' ? 'text-amber-500' : 'text-[#A0AEC0]'
                        }`}>{skill.status === 'weak' ? 'Needs Work' : skill.status}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#CBD5E0] group-hover:text-[#6366F1] transition-colors" />
                </motion.div>
              ))}
              {phase.skills.length === 0 && (
                <p className="text-xs font-bold text-[#CBD5E0] uppercase ml-2 italic">No requirements identified</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ALTERNATIVE CAREER PATHS */}
      <div className="px-4 pt-10 border-t border-[#F1F3F5]">
        <h2 className="text-xl font-black mb-8 uppercase tracking-tight">Alternative Career Fits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {(data?.suggested_roles || []).map(role => (
            <div
              key={role.role}
              className="glass-panel p-6 bg-white border-none shadow-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                setRoleOverride(role.role);
                fetchTree(role.role);
              }}
            >
              <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4">Projected Readiness</p>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-3xl font-black leading-none">
                  {Math.round(typeof role.projected_readiness_score === 'number' ? role.projected_readiness_score : role.fit_score)}%
                </span>
              </div>
              <p className="text-sm font-black mb-4 leading-tight truncate">{role.role}</p>
              <div className="h-1.5 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${typeof role.projected_readiness_score === 'number' ? role.projected_readiness_score : role.fit_score}%`,
                  }}
                  className="h-full bg-[#6366F1]"
                />
              </div>
              <p className="mt-3 text-[9px] font-bold text-[#A0AEC0] uppercase">
                Core fit: {role.matched_required}/{role.total_required} skills
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL SIDEBAR OVERLAY */}
      <AnimatePresence>
        {selectedSkill && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSkill(null)} className="fixed inset-0 bg-[#1A1C1E]/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-10 flex flex-col overflow-y-auto font-sans">
              <button onClick={() => setSelectedSkill(null)} className="absolute top-8 right-8 p-3 hover:bg-[#F8F9FB] rounded-2xl transition-colors"><X className="h-6 w-6 text-[#A0AEC0]" /></button>

              <div className="mt-10 flex-1">
                <span className="text-[10px] font-black text-[#6366F1] uppercase tracking-[0.2em]">{selectedSkill.phase}</span>
                <h2 className="text-4xl font-black mt-2 mb-8 tracking-tight leading-tight">{selectedSkill.skill.name}</h2>

                <div className="space-y-10">
                  <section>
                    <h3 className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4">Genome Evidence</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.skill.evidence.map((e, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F8F9FB] rounded-xl text-xs font-bold text-[#4A5568] border border-[#F1F3F5]">{e}</span>
                      ))}
                      {selectedSkill.skill.evidence.length === 0 && <p className="text-xs text-[#CBD5E0] italic">No direct DNA matches identified in current profile.</p>}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Bridging Resources</h3>
                      <span className="text-[10px] font-black text-[#6366F1]">{selectedSkill.skill.courses.length} Suggested Path(s)</span>
                    </div>
                    <div className="space-y-3">
                      {selectedSkill.skill.courses.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-[#F8F9FB] rounded-[1.8rem] hover:bg-[#EEF2FF] transition-all group/card border border-[#F1F3F5] hover:border-[#6366F1]/20">
                          <div className="min-w-0 pr-4">
                            <p className="text-sm font-black truncate">{c.title}</p>
                            <p className="text-[10px] font-bold text-[#A0AEC0] uppercase mt-1 tracking-tighter">{c.platform}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/card:bg-[#6366F1] group-hover/card:text-white transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </a>
                      ))}
                      {selectedSkill.skill.status === 'complete' && (
                        <div className="p-5 bg-emerald-50 rounded-[1.8rem] border border-emerald-100 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <p className="text-xs text-emerald-700 font-bold uppercase tracking-tight">Competency verified. No further training required.</p>
                        </div>
                      )}
                      {selectedSkill.skill.status !== 'complete' && selectedSkill.skill.courses.length === 0 && (
                        <p className="text-xs text-[#A0AEC0] italic px-2">Searching for optimal learning paths...</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[#F1F3F5]">
                <button onClick={() => navigate('/dashboard/recommendations')} className="btn-primary w-full !py-5 flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <BookOpen className="h-4 w-4" />
                  <span className="uppercase tracking-widest text-xs font-black">Full Learning Hub</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerPathways;