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
  Loader2,
  KeyRound,
  RotateCcw,
  Trash2
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const {
    loginWithEmail,
    signupWithEmail,
    retryRoleVerification,
    cancelSignupAndCleanup,
    quickDemoLogin
  } = useTuition();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Retry state for teacher/parent role code validation failure (prevents orphaned accounts)
  const [pendingRetry, setPendingRetry] = useState<{
    role: UserRole;
    fullName: string;
  } | null>(null);
  const [retryCode, setRetryCode] = useState('');

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

    if (isSignUp && selectedRole === 'TEACHER' && !joinCode.trim()) {
      setErrorMsg('Teacher join code is required to verify faculty registration.');
      return;
    }

    if (isSignUp && selectedRole === 'PARENT' && !joinCode.trim()) {
      setErrorMsg('Parent access code (from your student) is required.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await signupWithEmail(
          email.trim(),
          password,
          fullName.trim(),
          selectedRole,
          joinCode.trim()
        );
        if (!res.success) {
          if (res.requiresRetry) {
            setPendingRetry({
              role: res.pendingRole || selectedRole,
              fullName: fullName.trim()
            });
            setRetryCode(joinCode.trim());
          }
          setErrorMsg(res.error || 'Failed to complete registration.');
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

  const handleRetryVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRetry) return;
    if (!retryCode.trim()) {
      setErrorMsg('Please enter your join or parent link code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await retryRoleVerification(
        pendingRetry.role,
        retryCode.trim(),
        pendingRetry.fullName
      );
      if (!res.success) {
        setErrorMsg(res.error || 'Verification failed. Please double check your code.');
      } else {
        setPendingRetry(null);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAndCleanup = async () => {
    setIsLoading(true);
    try {
      await cancelSignupAndCleanup();
      setPendingRetry(null);
      setErrorMsg('Registration cancelled. Temporary profile removed with no orphaned account.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Cleanup failed.');
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

  const roleConfigs: {
    role: UserRole;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    {
      role: 'STUDENT',
      title: 'Student',
      subtitle: 'Homework & timetable',
      icon: GraduationCap,
      color: 'border-blue-500 bg-blue-50/60 text-blue-700'
    },
    {
      role: 'TEACHER',
      title: 'Teacher',
      subtitle: 'Faculty & gradebook',
      icon: Briefcase,
      color: 'border-teal-500 bg-teal-50/60 text-teal-800'
    },
    {
      role: 'PARENT',
      title: 'Parent',
      subtitle: 'Track child & fees',
      icon: Users,
      color: 'border-indigo-600 bg-indigo-50/60 text-indigo-800'
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
          Zero-Cost Academic Portal & Student Progress Hub
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
                setPendingRetry(null);
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
                setPendingRetry(null);
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

          {/* Pending Verification / Retry State to prevent orphaned accounts */}
          {pendingRetry ? (
            <div className="space-y-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingRetry.role === 'TEACHER' ? 'Teacher' : 'Parent'} Verification Required
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your base login was created, but your {pendingRetry.role.toLowerCase()} join code
                    needs verification to activate permissions.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRetryVerification} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {pendingRetry.role === 'TEACHER' ? 'Teacher Join Code' : 'Parent Access Code (from Student)'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={retryCode}
                      onChange={(e) => setRetryCode(e.target.value.toUpperCase())}
                      placeholder={pendingRetry.role === 'TEACHER' ? 'e.g., T-XXXXXX' : 'e.g., P-XXXXXX'}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Retry Verification</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelAndCleanup}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel & Clean Up</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
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
                    <div className="grid grid-cols-3 gap-2">
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
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-bold">{cfg.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {cfg.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Join Code Input based on selected role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {selectedRole === 'TEACHER' && 'Teacher Join Code (from Institute Admin)'}
                      {selectedRole === 'PARENT' && 'Student Access Code (from your child)'}
                      {selectedRole === 'STUDENT' && 'Student Join Code (Optional if joining open batch)'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required={selectedRole === 'TEACHER' || selectedRole === 'PARENT'}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder={
                          selectedRole === 'TEACHER'
                            ? 'e.g., T-XXXXXX (Required)'
                            : selectedRole === 'PARENT'
                            ? 'e.g., P-XXXXXX (Required)'
                            : 'e.g., S-XXXXXX (Optional)'
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      />
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
          )}

          {/* Quick Demo Access Bar (Only shown in Development) */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Test with Demo Profiles (Dev Mode Only)</span>
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
          )}
        </div>
      </div>
    </div>
  );
};
