import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  GraduationCap,
  RefreshCcw,
  Target,
} from 'lucide-react';

type Course = {
  platform: string;
  title: string;
  url: string;
};

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
};

type PathwaysResponse = {
  user_id: string;
  target_sector: string;
  target_role_input: string;
  target_role: string;
  available_roles: string[];
  stats: {
    skills_total: number;
    skills_complete: number;
    skills_weak: number;
    skills_missing: number;
    readiness_score: number;
  };
  pathway: {
    phases: PathwayPhase[];
  };
  suggested_roles: SuggestedRole[];
  error?: string;
};

const phaseLabel: Record<string, string> = {
  foundation: 'Foundation',
  core: 'Core',
  advanced: 'Advanced',
  projects: 'Projects',
};

function statusStyles(status: PathwaySkill['status']) {
  switch (status) {
    case 'complete':
      return {
        wrapper: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15',
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
        pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        pillText: 'Completed',
      };
    case 'weak':
      return {
        wrapper: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15',
        icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
        pill: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        pillText: 'Needs work',
      };
    default:
      return {
        wrapper: 'border-white/10 bg-white/5 hover:bg-white/10',
        icon: <Target className="h-4 w-4 text-secondary" />,
        pill: 'bg-white/5 text-secondary border-white/10',
        pillText: 'Missing',
      };
  }
}

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
  const [selectedSkill, setSelectedSkill] = useState<{
    skill: PathwaySkill;
    phase: string;
  } | null>(null);

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const fetchTree = async (role?: string) => {
    setError(null);
    setLoading(true);

    if (!userId) {
      setError('Missing user_id. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const url = new URL(`${apiBaseUrl}/api/pathways/tree`);
      url.searchParams.set('user_id', userId);
      if (role) url.searchParams.set('target_role', role);

      const res = await fetch(url.toString());
      let json: PathwaysResponse | null = null;
      try {
        json = (await res.json()) as PathwaysResponse;
      } catch {
        json = null;
      }

      if (res.status === 401 || res.status === 404) {
        forceLogout();
        return;
      }

      if (!res.ok) {
        setError(json?.error || 'Failed to load pathways');
        setData(null);
        return;
      }

      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phases = useMemo(() => data?.pathway?.phases || [], [data]);

  const phaseProgress = useMemo(() => {
    const out: Record<string, { total: number; complete: number; weak: number; missing: number }> = {};
    for (const p of phases) {
      const total = p.skills?.length || 0;
      const complete = p.skills?.filter((s) => s.status === 'complete').length || 0;
      const weak = p.skills?.filter((s) => s.status === 'weak').length || 0;
      const missing = p.skills?.filter((s) => s.status === 'missing').length || 0;
      out[p.phase] = { total, complete, weak, missing };
    }
    return out;
  }, [phases]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <GitBranch className="h-8 w-8" />
            Career Pathways
          </h1>
          <p className="text-secondary">
            A role-based skill tree showing what you’ve completed and what to learn next.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => fetchTree(roleOverride || undefined)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6"
      >
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <p className="text-sm text-secondary">Target Sector</p>
            <p className="text-lg font-semibold">{data?.target_sector || '—'}</p>
          </div>

          <div className="flex-1">
            <label className="block text-sm text-secondary mb-2">Target Role</label>
            <select
              value={roleOverride}
              onChange={(e) => {
                const next = e.target.value;
                setRoleOverride(next);
                setSelectedSkill(null);
                fetchTree(next || undefined);
              }}
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">
                {data?.target_role ? `Use profile role (${data.target_role})` : 'Use profile role'}
              </option>
              {(data?.available_roles || []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <p className="text-sm text-secondary">Readiness</p>
            <p className="text-lg font-semibold">{data ? `${Math.round(data.stats.readiness_score)}%` : '—'}</p>
            {data && (
              <p className="text-xs text-secondary mt-1">
                {data.stats.skills_complete} complete, {data.stats.skills_weak} weak, {data.stats.skills_missing} missing
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {loading && <div className="mt-6 text-secondary">Loading pathway…</div>}

        {!loading && data && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="glass-panel p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Career Goal</p>
                    <p className="text-2xl font-bold">{data.target_role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary">Skill Tree</p>
                    <p className="text-xs text-secondary">Click a skill to see details</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {phases.map((phase) => {
                  const stats = phaseProgress[phase.phase] || { total: 0, complete: 0, weak: 0, missing: 0 };
                  return (
                    <div key={phase.phase} className="glass-panel p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-secondary">{phaseLabel[phase.phase] || phase.phase}</p>
                          <p className="font-semibold">{stats.complete}/{stats.total} complete</p>
                        </div>
                        <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center">
                          <Target className="h-4 w-4 text-secondary" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {phase.skills.map((skill) => {
                          const styles = statusStyles(skill.status);
                          const isSelected =
                            selectedSkill?.skill?.name === skill.name && selectedSkill?.phase === phase.phase;

                          return (
                            <button
                              key={`${phase.phase}:${skill.name}`}
                              type="button"
                              onClick={() => setSelectedSkill({ skill, phase: phase.phase })}
                              className={
                                `w-full text-left px-3 py-2 rounded-lg border transition-all ` +
                                styles.wrapper +
                                (isSelected ? ' ring-2 ring-primary/40' : '')
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {styles.icon}
                                  <span className="text-sm font-medium truncate">{skill.name}</span>
                                </div>
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-full border ${styles.pill}`}
                                >
                                  {styles.pillText}
                                </span>
                              </div>
                              {typeof skill.confidence === 'number' && (
                                <p className="text-xs text-secondary mt-1">
                                  Confidence: {Math.round(skill.confidence * 100)}%
                                </p>
                              )}
                            </button>
                          );
                        })}

                        {phase.skills.length === 0 && (
                          <p className="text-sm text-secondary">No skills in this phase.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="glass-panel p-5 mt-6">
                <h3 className="text-lg font-bold mb-2">Roles You’re Closest To</h3>
                <p className="text-sm text-secondary mb-4">
                  Based on how many foundation+core skills you already have.
                </p>
                <div className="space-y-3">
                  {(data.suggested_roles || []).map((r) => (
                    <div key={r.role} className="p-3 rounded-lg border border-white/10 bg-white/5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{r.role}</p>
                        <p className="text-sm text-secondary">{Math.round(r.fit_score)}%</p>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-violet-400"
                          style={{ width: `${Math.min(100, Math.max(0, r.fit_score))}%` }}
                        />
                      </div>
                      <p className="text-xs text-secondary mt-2">
                        {r.matched_required}/{r.total_required} required skills matched
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="glass-panel p-5 sticky top-6">
                <h3 className="text-lg font-bold mb-2">Skill Details</h3>
                {!selectedSkill ? (
                  <p className="text-secondary text-sm">Select a skill node to see details and learning links.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-secondary">Phase</p>
                      <p className="font-semibold">{phaseLabel[selectedSkill.phase] || selectedSkill.phase}</p>
                    </div>

                    <div>
                      <p className="text-xs text-secondary">Skill</p>
                      <p className="text-xl font-bold">{selectedSkill.skill.name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-secondary">Status</p>
                      <p className="font-semibold capitalize">{selectedSkill.skill.status}</p>
                      {typeof selectedSkill.skill.confidence === 'number' && (
                        <p className="text-xs text-secondary mt-1">
                          Confidence: {Math.round(selectedSkill.skill.confidence * 100)}%
                        </p>
                      )}
                    </div>

                    {selectedSkill.skill.evidence?.length > 0 && (
                      <div>
                        <p className="text-xs text-secondary mb-2">Evidence</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkill.skill.evidence.slice(0, 8).map((ev, idx) => (
                            <span
                              key={`${ev}-${idx}`}
                              className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-secondary"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSkill.skill.courses?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="h-4 w-4 text-secondary" />
                          <p className="text-xs text-secondary">Suggested courses</p>
                        </div>
                        <div className="space-y-2">
                          {selectedSkill.skill.courses.map((c) => (
                            <a
                              key={c.url}
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                            >
                              <p className="text-sm font-medium">{c.title}</p>
                              <p className="text-xs text-secondary mt-1">{c.platform}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSkill.skill.status === 'complete' && (
                      <p className="text-sm text-secondary">
                        Nice — this node is highlighted because it’s already in your profile skills.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CareerPathways;
