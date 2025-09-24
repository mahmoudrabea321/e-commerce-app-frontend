import React, { useState } from 'react';
import './SignIn.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { API } from '../config'; 

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ FIXED: Added ${API} to URL
      const { data } = await axios.post(`${API}/api/users/signin`, {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          isAdmin: data.isAdmin,
          token: data.token,
        })
      );

      login(data);
      navigate(redirect);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && <div className="error-message">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <p>
          Don't have an account?{" "}
          <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default SignInPage;