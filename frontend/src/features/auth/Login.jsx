import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  const mockUsers = [
    { email: 'admin@factoryiq.com', label: 'Admin', color: 'border-red-500/30 hover:border-red-500/60' },
    { email: 'pm@factoryiq.com', label: 'Project Mgr', color: 'border-blue-500/30 hover:border-blue-500/60' },
    { email: 'planner@factoryiq.com', label: 'Prod Planner', color: 'border-green-500/30 hover:border-green-500/60' },
    { email: 'quality@factoryiq.com', label: 'Quality Eng', color: 'border-amber-500/30 hover:border-amber-500/60' },
    { email: 'scm@factoryiq.com', label: 'Supply Chain', color: 'border-purple-500/30 hover:border-purple-500/60' },
    { email: 'acme_rep@factoryiq.com', label: 'Customer Rep (Acme)', color: 'border-cyan-500/30 hover:border-cyan-500/60' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-950 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 glass-panel overflow-hidden glow-cyan">
        
        {/* Left Side Panel: Features & Mock Users list */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-obsidian-900 via-obsidian-900 to-obsidian-800 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/40">
          <div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-precision-cyan to-blue-600 flex items-center justify-center font-bold text-obsidian-950 mb-6 glow-cyan">
              FIQ
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-3">
              FactoryIQ Portal
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Enterprises Manufacturing Excellence Platform. Access R&D stage gates, SPC charts, live shopfloor telemetry, and logistics pipelines.
            </p>

            <div className="space-y-3">
              <div className="text-xs text-precision-cyan font-semibold uppercase tracking-wider">
                Demo Accounts Quick Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mockUsers.map((mu) => (
                  <button
                    key={mu.email}
                    onClick={() => handleQuickLogin(mu.email)}
                    type="button"
                    className={`px-3 py-2 text-[11px] font-medium text-left border rounded bg-obsidian-800/40 text-slate-300 transition-all ${mu.color}`}
                  >
                    <div>{mu.label}</div>
                    <div className="text-[9px] text-slate-500 truncate">{mu.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-[11px] text-slate-500 font-mono">
            Default Password: <span className="text-precision-cyanLight">password123</span>
          </div>
        </div>

        {/* Right Side Panel: Login Input fields */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-obsidian-900/40">
          <h3 className="text-xl font-bold text-slate-200 mb-6">Account Authentication</h3>
          
          {error && (
            <div className="mb-4 px-4 py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-obsidian-950 border border-slate-800/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-precision-cyan/80 focus:ring-1 focus:ring-precision-cyan/20"
                  placeholder="e.g. quality@factoryiq.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-obsidian-950 border border-slate-800/80 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-precision-cyan/80 focus:ring-1 focus:ring-precision-cyan/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-gradient-to-r from-precision-cyan to-blue-600 hover:from-precision-cyanLight hover:to-blue-500 text-obsidian-950 font-bold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;
