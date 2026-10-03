import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearAuthError } from '../features/auth/authSlice';
import { APP_NAME } from '../utils/constants';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  // Once registration completes and user is authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientError) setClientError('');
    if (error) dispatch(clearAuthError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setClientError('Name must be at least 2 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setClientError('Please provide a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setClientError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setClientError('Passwords do not match');
      return;
    }

    // Security: Only send name, email, and password. Role is strictly assigned by the backend.
    dispatch(
      registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })
    );
  };

  const displayedError = clientError || error;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center py-4">
      <section className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative isolate overflow-hidden bg-[#0b1120] px-6 py-7 text-white sm:px-9 sm:py-9 lg:flex lg:min-h-136 lg:flex-col lg:justify-between lg:px-11 lg:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full bg-indigo-500/15 blur-[90px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />
          <div className="relative">
            <Link to="/" aria-label={`${APP_NAME} home`} className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold tracking-wide text-white">CF</span>
              <span className="text-sm font-semibold tracking-tight text-white">{APP_NAME}</span>
            </Link>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">A shared place to begin</p>
            <h2 className="mt-3 max-w-sm text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">Bring your team&apos;s next good idea to life.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Create a workspace, organize projects, and make the next step clear for everyone.</p>
          </div>

          <div className="relative mt-8 rounded-xl border border-white/10 bg-white/4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">A little more clarity</p>
                <p className="mt-1 text-sm font-semibold text-white">Project progress</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-200">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 18V5m0 13h16M8 15l3-4 3 2 5-7" /></svg>
              </span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-300">Tasks moving forward</span><span className="font-medium text-white">8 of 12</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-2/3 rounded-full bg-linear-to-r from-indigo-400 to-violet-400" /></div>
              <div className="flex items-center justify-between gap-3 pt-1 text-[10px] text-slate-400"><span>Shared ownership</span><span>Visible progress</span></div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Get started</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Create your {APP_NAME} account</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Set up your account and start collaborating with your team.</p>
            </div>

            {displayedError && (
              <div
                id="register-error-alert"
                role="alert"
                aria-live="assertive"
                className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Morgan"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 inline-flex items-center rounded-r-lg px-3 text-slate-500 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-900/10 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-700 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Sign in instead</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
