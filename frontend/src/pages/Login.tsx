import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isSignUp ? '/auth/register' : '/auth/login';
            const payload = isSignUp
                ? { name: formData.name, username: formData.username, email: formData.email, password: formData.password }
                : { username: formData.username, password: formData.password };

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                if (isSignUp) {
                    alert(`Account created! User ID: ${data.user_id}`);
                    setIsSignUp(false); // Switch to login view
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user_id', data.user_id);
                    navigate('/dashboard'); // Redirect to dashboard
                }
            } else {
                alert(`Error: ${data.error || 'Something went wrong'}`);
            }
        } catch (error) {
            alert(`Network error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md p-8 glass-panel shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.h1
                        className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                    >
                        SkillGenome
                    </motion.h1>
                    <p className="text-secondary">AI-Driven Career Architect</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {isSignUp && (
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="input-field pl-10"
                                    required={isSignUp}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-5 w-5 text-secondary" />
                            <input
                                type="text"
                                placeholder="Username"
                                className="input-field pl-10"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        {isSignUp && (
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-secondary" />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="input-field pl-10"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-secondary" />
                            <input
                                type="password"
                                placeholder="Password"
                                className="input-field pl-10"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader className="animate-spin" /> : (
                            <>
                                {isSignUp ? 'Create Account' : 'Access System'}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-secondary text-sm">
                        {isSignUp ? 'Already have an account?' : 'New to SkillGenome?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-primary hover:text-accent font-medium transition-colors"
                        >
                            {isSignUp ? 'Login' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
