import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useTuition } from '../../context/TuitionContext';
import {
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  School,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const { loginWithEmail, signupWithEmail, quickDemoLogin } = useTuition();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await signupWithEmail(email.trim(), password, fullName.trim(), selectedRole);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      } else {
        const res = await loginWithEmail(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await quickDemoLogin(role);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to sign in to demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs: { role: UserRole; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    {
      role: 'STUDENT',
      title: 'Student',
      subtitle: 'Homework, timetables, and tests',
      icon: GraduationCap,
      color: 'border-blue-500 bg-blue-50/60 text-blue-700'
    },
    {
      role: 'TEACHER',
      title: 'Teacher',
      subtitle: 'Mark attendance, batches & grading',
      icon: Briefcase,
      color: 'border-teal-600 bg-teal-50/60 text-teal-800'
    },
    {
      role: 'PARENT',
      title: 'Parent',
      subtitle: 'Track child performance & pay fees',
      icon: Users,
      color: 'border-indigo-600 bg-indigo-50/60 text-indigo-800'
    },
    {
      role: 'ADMIN',
      title: 'School Admin',
      subtitle: 'Institution roster & school codes',
      icon: ShieldCheck,
      color: 'border-purple-600 bg-purple-50/60 text-purple-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <School className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Apex TuitionPlatform
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-300">
          Cloud-Powered Academic Portal & Student Progress Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                !isSignUp
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                isSignUp
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Aravind Kumar or Dr. Wilson"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Your Role in the Institution
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roleConfigs.map((cfg) => {
                      const Icon = cfg.icon;
                      const isSelected = selectedRole === cfg.role;
                      return (
                        <button
                          key={cfg.role}
                          type="button"
                          onClick={() => setSelectedRole(cfg.role)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? `${cfg.color} ring-2 ring-indigo-500 font-semibold shadow-xs`
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-bold">{cfg.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {cfg.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isSignUp ? (
                <>
                  <span>Create Account & Join</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Test with Demo Profiles (No Typing Needed)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4 mb-1 text-blue-600" />
                <span>Student</span>
                <span className="text-[10px] text-blue-600/70 font-normal">Aravind</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('TEACHER')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Briefcase className="w-4 h-4 mb-1 text-teal-600" />
                <span>Teacher</span>
                <span className="text-[10px] text-teal-600/70 font-normal">Mr. Kingslin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('PARENT')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Users className="w-4 h-4 mb-1 text-indigo-600" />
                <span>Parent</span>
                <span className="text-[10px] text-indigo-600/70 font-normal">Kumar Raman</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 mb-1 text-purple-600" />
                <span>Admin</span>
                <span className="text-[10px] text-purple-600/70 font-normal">Principal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
