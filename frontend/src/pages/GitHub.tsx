import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Loader2, RefreshCcw, Save } from 'lucide-react';

type GitHubSkill = {
  name: string;
  confidence: number;
  source: 'github';
  evidence: string;
};

type GitHubProject = {
  name: string;
  description: string;
  url: string;
  language: string;
  language_breakdown?: Record<string, number>;
  topics?: string[];
  stars?: number;
  updated_at?: string;
};

type ImportResponse = {
  status: 'success';
  imported: { projects: number; skills: number };
  github_username: string;
  total_repos: number;
  projects: GitHubProject[];
  skills: GitHubSkill[];
  message: string;
};

function parseUsernameFromGithubUrl(value: string): string | null {
  const raw = (value || '').trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const u = new URL(raw);
      if (!['github.com', 'www.github.com'].includes(u.hostname.toLowerCase())) return null;
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] ?? null;
    } catch {
      return null;
    }
  }

  // allow passing a plain username
  return raw;
}

const GitHubTab: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const userId = localStorage.getItem('user_id');

  const [githubInput, setGithubInput] = useState<string>('');
  const [includeLanguageBreakdown, setIncludeLanguageBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [existingSkills, setExistingSkills] = useState<any[]>([]);
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  const githubUsername = useMemo(() => parseUsernameFromGithubUrl(githubInput), [githubInput]);

  const refreshProfile = async () => {
    if (!userId) return;
    setRefreshingProfile(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setExistingProjects(data?.projects || []);
      setExistingSkills(data?.skills || []);
    } finally {
      setRefreshingProfile(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImport = async () => {
    setError(null);
    setImportResult(null);

    if (!userId) {
      setError('Missing user_id. Please log in again.');
      return;
    }

    if (!githubUsername) {
      setError('Please enter a valid GitHub username or profile URL.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/import/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          github_username: githubUsername,
          github_url: githubInput,
          include_language_breakdown: includeLanguageBreakdown,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || 'GitHub import failed');
        return;
      }

      setImportResult(data as ImportResponse);
      await refreshProfile();
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const languageSkillSummary = useMemo(() => {
    if (!importResult?.skills?.length) return [];
    return [...importResult.skills]
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 12);
  }, [importResult]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Github className="h-8 w-8" />
          GitHub
        </h1>
        <p className="text-secondary">Import repositories as projects and infer skills from languages used</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block text-sm text-secondary mb-2">GitHub profile URL or username</label>
            <input
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              placeholder="https://github.com/your-username"
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {githubInput && (
              <p className="text-xs text-secondary mt-2">
                Parsed username: <span className="text-white">{githubUsername || 'invalid'}</span>
              </p>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm text-secondary">
              <input
                type="checkbox"
                checked={includeLanguageBreakdown}
                onChange={(e) => setIncludeLanguageBreakdown(e.target.checked)}
                className="accent-primary"
              />
              Include per-repo language breakdown (uses more GitHub API requests)
            </label>
          </div>

          <button
            onClick={runImport}
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-primary hover:bg-primary/90 transition-all text-white font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Import
          </button>

          <button
            onClick={refreshProfile}
            disabled={refreshingProfile}
            className="px-5 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refresh from saved profile"
          >
            {refreshingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
            Refresh
          </button>
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        {importResult && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4">
              <p className="text-xs text-secondary">Imported Projects</p>
              <p className="text-2xl font-bold">{importResult.imported.projects}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-secondary">Derived Skills</p>
              <p className="text-2xl font-bold">{importResult.imported.skills}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-secondary">Total Public Repos</p>
              <p className="text-2xl font-bold">{importResult.total_repos}</p>
            </div>
          </div>
        )}
      </motion.div>

      {languageSkillSummary.length > 0 && (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4">Top Skills (from languages)</h2>
          <div className="flex flex-wrap gap-2">
            {languageSkillSummary.map((s) => (
              <span key={s.name} className="px-3 py-1 rounded-full bg-primary/15 border border-primary/20 text-sm">
                {s.name} <span className="text-secondary">({Math.round((s.confidence || 0) * 100)}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {importResult?.projects?.length ? (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-4">Imported Repositories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {importResult.projects.map((p) => (
              <div key={p.url} className="glass-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-secondary mt-1">{p.description}</p>
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.language && (
                    <span className="px-2 py-1 rounded bg-white/5 text-xs">{p.language}</span>
                  )}
                  {Array.isArray(p.topics) &&
                    p.topics.slice(0, 6).map((t) => (
                      <span key={t} className="px-2 py-1 rounded bg-white/5 text-xs">{t}</span>
                    ))}
                </div>

                {p.language_breakdown && Object.keys(p.language_breakdown).length > 0 && (
                  <p className="mt-3 text-xs text-secondary">
                    Languages: {Object.keys(p.language_breakdown).slice(0, 6).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(existingProjects?.length > 0 || existingSkills?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4">Saved Projects</h2>
            {existingProjects?.length ? (
              <div className="space-y-3">
                {existingProjects.slice(0, 8).map((p: any) => (
                  <div key={`${p.github_url || ''}-${p.project_name}`} className="glass-panel p-4">
                    <p className="font-semibold">{p.project_name}</p>
                    <p className="text-sm text-secondary mt-1">{p.description || 'No description'}</p>
                    {p.github_url && (
                      <a
                        href={p.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm inline-flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="h-4 w-4" /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No saved projects yet.</p>
            )}
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4">Saved Skills</h2>
            {existingSkills?.length ? (
              <div className="flex flex-wrap gap-2">
                {existingSkills.slice(0, 20).map((s: any) => (
                  <span key={`${s.skill_name}-${s.source}-${s.created_at || ''}`} className="px-3 py-1 rounded-full bg-white/5 text-sm">
                    {s.skill_name}
                    {typeof s.confidence === 'number' && (
                      <span className="text-secondary"> ({Math.round(s.confidence * 100)}%)</span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No saved skills yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubTab;
