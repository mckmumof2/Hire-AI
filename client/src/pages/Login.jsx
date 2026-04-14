import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple hardcoded password for easy deployment/testing
    // You can change this later to your preferred password.
    if (password === 'hireai2026') {
      onLogin();
    } else {
      setError('Invalid access key. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-placeholder">H</div>
        <h1>Hire AI Dashboard</h1>
        <p>Enter your access key to manage studio applications.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Enter Access Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-large">Access Studio Dashboard</button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: #0a0b10;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .logo-placeholder {
          width: 50px;
          height: 50px;
          background: var(--accent-gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          margin: 0 auto 20px;
          color: white;
        }

        h1 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        p {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 30px;
          font-size: 0.9rem;
        }

        .form-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          font-size: 1rem;
          margin-bottom: 15px;
          text-align: center;
          letter-spacing: 2px;
        }

        .form-group input:focus {
          border-color: var(--accent-primary);
          outline: none;
        }

        .error-message {
          color: #ff4757;
          margin-bottom: 15px;
          font-size: 0.85rem;
          background: rgba(255, 71, 87, 0.1);
          padding: 8px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default Login;
