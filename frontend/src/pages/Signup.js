import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';

const inputCls =
  'w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        user_id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
      }));
      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon: Icon, ...props }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <input {...props} className={inputCls} />
    </div>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start grading with PaperPilot"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" data-testid="signup-error">
          <AlertCircle size={17} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle size={17} className="shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
          <Field icon={User} type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Jane Teacher" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
          <Field icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="teacher@school.com" autoComplete="email" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
          <Field icon={Lock} type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="Min. 8 characters" autoComplete="new-password" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
          <Field icon={Lock} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter password" autoComplete="new-password" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Signup;
