import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ProfileUser = {
  user_id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  target_sector?: string | null;
  target_role?: string | null;
};

type ProfileResponse = {
  user: ProfileUser;
  skills: any[];
  courses: any[];
  projects: any[];
  latest_analysis: any | null;
  error?: string;
};

type RolesResponse = {
  available_roles?: string[];
  target_role?: string;
  target_sector?: string;
  error?: string;
};

const SECTORS = ['Healthcare', 'Agriculture', 'Urban'] as const;

const Profile: React.FC = () => {
  const apiBaseUrl = useMemo(
    () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
    []
  );
  const navigate = useNavigate();

  const userId = localStorage.getItem('user_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Editable fields
  const [name, setName] = useState('');
  const [targetSector, setTargetSector] = useState<string>('Healthcare');
  const [targetRole, setTargetRole] = useState<string>('software engineer');

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const load = async () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError('Missing user_id. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profileRes = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
      let profileJson: ProfileResponse | null = null;
      try {
        profileJson = (await profileRes.json()) as ProfileResponse;
      } catch {
        profileJson = null;
      }

      if (profileRes.status === 401 || profileRes.status === 404) {
        forceLogout();
        return;
      }
      if (!profileRes.ok) {
        throw new Error(profileJson?.error || 'Failed to load profile');
      }

      if (!profileJson) {
        throw new Error('Failed to parse profile response');
      }

      setUser(profileJson.user);
      setName(String(profileJson.user?.name || ''));
      setTargetSector(String(profileJson.user?.target_sector || 'Healthcare'));
      setTargetRole(String(profileJson.user?.target_role || 'software engineer'));

      // Fetch available roles list (best-effort)
      const rolesUrl = new URL(`${apiBaseUrl}/api/pathways/tree`);
      rolesUrl.searchParams.set('user_id', userId);
      const rolesRes = await fetch(rolesUrl.toString());
      let rolesJson: RolesResponse | null = null;
      try {
        rolesJson = (await rolesRes.json()) as RolesResponse;
      } catch {
        rolesJson = null;
      }

      if (rolesRes.status === 401 || rolesRes.status === 404) {
        forceLogout();
        return;
      }
      if (rolesRes.ok && rolesJson && Array.isArray(rolesJson.available_roles)) {
        setAvailableRoles(rolesJson.available_roles);
      } else {
        setAvailableRoles([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError('Missing user_id. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          target_sector: targetSector,
          target_role: targetRole,
        }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (res.status === 401 || res.status === 404) {
        forceLogout();
        return;
      }
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to save profile');
      }

      // Keep localStorage in sync for pages that still read it
      localStorage.setItem('targetRole', targetRole);
      localStorage.setItem('targetSector', targetSector);

      setSuccess('Profile saved');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Profile</h1>
        <p className="text-secondary">Set your career goal once and use it everywhere</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-200">
          {success}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        {loading ? (
          <div className="text-secondary">Loading profile…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="glass-panel p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                    <User2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold truncate">{user?.username || 'User'}</p>
                    <p className="text-xs text-secondary truncate">{user?.email || '—'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-xs text-secondary">User ID</p>
                    <p className="text-sm font-medium truncate">{user?.user_id || userId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Current goal</p>
                    <p className="text-sm font-medium">
                      {(user?.target_sector || targetSector || '—') + ' • ' + (user?.target_role || targetRole || '—')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="glass-panel p-5">
                <h2 className="text-xl font-bold mb-4">Career Goal</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-secondary mb-2">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-secondary mb-2">Target sector</label>
                    <select
                      value={targetSector}
                      onChange={(e) => setTargetSector(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-secondary mb-2">Target role</label>
                    {availableRoles.length > 0 ? (
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g., software engineer"
                        className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}
                    <p className="text-xs text-secondary mt-2">
                      This role becomes the default for Recommendations and Career Pathways.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="px-5 py-3 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className={saving ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
