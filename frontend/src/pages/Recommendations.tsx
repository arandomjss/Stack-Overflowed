import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Youtube, ExternalLink, Filter, Award, Clock } from 'lucide-react';

interface Course {
  platform: string;
  title: string;
  url: string;
}

interface Video {
  title: string;
  channel: string;
  url: string;
  duration: string;
}

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
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  useEffect(() => {
    // Load user skills from localStorage or fetch from API
    const loadRecommendations = async () => {
      try {
        const apiBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000';
        // Get skills from localStorage (set during resume upload)
        const storedSkills = localStorage.getItem('userSkills');
        const storedTargetRole = localStorage.getItem('targetRole');
        const storedTargetSector = localStorage.getItem('targetSector');
        const userId = localStorage.getItem('user_id');

        let skills: Array<{ name: string; confidence: number }> | null = null;
        let targetRole: string = storedTargetRole || 'software engineer';
        let targetSector: string = storedTargetSector || 'Healthcare';

        if (storedSkills) {
          skills = JSON.parse(storedSkills);
        } else if (userId) {
          // If this is an existing profile (skills saved in DB) but localStorage isn't set,
          // load the user's skills from the backend profile endpoint.
          const profileRes = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
          if (profileRes.status === 401 || profileRes.status === 404) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            window.location.assign('/');
            return;
          }
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData?.user?.target_role) {
              targetRole = String(profileData.user.target_role);
              localStorage.setItem('targetRole', targetRole);
            }
            if (profileData?.user?.target_sector) {
              targetSector = String(profileData.user.target_sector);
              localStorage.setItem('targetSector', targetSector);
            }
            if (Array.isArray(profileData?.skills) && profileData.skills.length > 0) {
              skills = profileData.skills
                .filter((s: any) => s?.skill_name)
                .map((s: any) => ({
                  name: String(s.skill_name),
                  confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
                }));
            }
          }
        }

        if (skills && skills.length > 0) {
          const response = await fetch(`${apiBaseUrl}/api/recommendations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              skills: skills,
              target_role: targetRole,
            }),
          });

          if (response.ok) {
            const recommendationsData = await response.json();
            setData(recommendationsData);
          } else {
            const errText = await response.text();
            throw new Error(`Recommendations API error (${response.status}): ${errText}`);
          }
        } else {
          // Demo data if no skills uploaded yet
          setData({
            readiness_score: 45,
            target_role: 'software engineer',
            recommendations: [
              {
                skill_name: 'Docker',
                phase: 'core',
                priority: 'high',
                courses: [
                  { platform: 'Udemy', title: 'Docker Mastery', url: '#' },
                  { platform: 'Coursera', title: 'Docker Containers', url: '#' },
                ],
                videos: [
                  { title: 'Docker Tutorial', channel: 'Programming with Mosh', url: '#', duration: '1:15:16' },
                ],
                reason: 'Required for software engineer role in core phase',
              },
            ],
            summary: {
              total_skills_needed: 15,
              current_skills: 8,
              courses_available: 45,
              videos_available: 30,
            },
          });
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'foundation': return 'text-blue-400 bg-blue-500/20';
      case 'core': return 'text-violet-400 bg-violet-500/20';
      case 'advanced': return 'text-purple-400 bg-purple-500/20';
      case 'projects': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredRecommendations = data?.recommendations.filter((rec) => {
    const phaseMatch = selectedPhase === 'all' || rec.phase === selectedPhase;
    const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
    return phaseMatch && priorityMatch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2">Learning Recommendations</h1>
        <p className="text-secondary">Personalized courses and tutorials to reach your career goals</p>
      </motion.div>

      {/* Readiness Score Card */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Career Readiness for {data.target_role}</h2>
              <p className="text-secondary text-sm">Based on your current skills</p>
            </div>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.readiness_score / 100)}`}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{data.readiness_score}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-sm text-secondary mb-1">Skills Needed</p>
              <p className="text-2xl font-bold">{data.summary.total_skills_needed}</p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Current Skills</p>
              <p className="text-2xl font-bold">{data.summary.current_skills}</p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Courses Available</p>
              <p className="text-2xl font-bold">{data.summary.courses_available}</p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Video Tutorials</p>
              <p className="text-2xl font-bold">{data.summary.videos_available}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-secondary" />
            <span className="text-sm font-semibold">Filters:</span>
          </div>
          
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Phases</option>
            <option value="foundation">Foundation</option>
            <option value="core">Core</option>
            <option value="advanced">Advanced</option>
            <option value="projects">Projects</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <span className="text-sm text-secondary ml-auto">
            Showing {filteredRecommendations.length} recommendations
          </span>
        </div>
      </motion.div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="glass-panel p-6 hover:scale-[1.02] transition-transform"
          >
            {/* Skill Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{rec.skill_name}</h3>
                <p className="text-sm text-secondary">{rec.reason}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                  {rec.priority.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPhaseColor(rec.phase)}`}>
                  {rec.phase}
                </span>
              </div>
            </div>

            {/* Courses Section */}
            {rec.courses.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Recommended Courses</span>
                </div>
                <div className="space-y-2">
                  {rec.courses.map((course, idx) => (
                    <a
                      key={idx}
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {course.title}
                          </p>
                          <p className="text-xs text-secondary mt-1">{course.platform}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-secondary group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {rec.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold">Video Tutorials</span>
                </div>
                <div className="space-y-2">
                  {rec.videos.map((video, idx) => (
                    <a
                      key={idx}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm group-hover:text-red-400 transition-colors">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-secondary">{video.channel}</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-secondary" />
                              <span className="text-xs text-secondary">{video.duration}</span>
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-secondary group-hover:text-red-400 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-12 text-center"
        >
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No recommendations found</h3>
          <p className="text-secondary">Try adjusting your filters or upload your resume to get started</p>
        </motion.div>
      )}
    </div>
  );
};

export default Recommendations;
