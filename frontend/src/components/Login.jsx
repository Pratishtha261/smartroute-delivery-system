import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
      const response = isRegister
        ? await authAPI.register({ name: name.trim(), email: trimmedEmail, password: trimmedPassword, role })
        : await authAPI.login({ email: trimmedEmail, password: trimmedPassword });
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('authToken', token);
        login(user);
        const rolePath = user.role === 'manager' ? '/' : user.role === 'partner' ? '/partner' : '/customer';
        navigate(rolePath);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? 'Create Account' : 'Secure Login'}</h2>
        <p className="login-subtitle">Manager, Partner, Customer</p>
        {message && <p className="login-message error">{message}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="manager">Manager</option>
              <option value="partner">Partner</option>
              <option value="customer">Customer</option>
            </select>
          )}
          <button type="submit" disabled={isLoading}>
            {isLoading ? (isRegister ? 'Creating...' : 'Signing in...') : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>
        <div className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={() => setIsRegister((v) => !v)}>
            {isRegister ? 'Login' : 'Register'}
          </button>
        </div>
        <div className="login-help">
          <p>Demo accounts:</p>
          <p>manager@demo.com / manager123</p>
          <p>partner@demo.com / partner123</p>
          <p>customer@demo.com / customer123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
