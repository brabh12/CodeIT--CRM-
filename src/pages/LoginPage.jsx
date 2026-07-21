import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      addToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      addToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-accent)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: 'var(--space-2)'
          }}>
            C
          </div>
          <h1 className="login-title">CodeIt CRM</h1>
          <p className="login-subtitle">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@codeit.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />

          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
