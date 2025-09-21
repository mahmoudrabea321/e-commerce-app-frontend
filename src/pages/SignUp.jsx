import React, { useState } from 'react';
import './SignUp.css'; 
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post('/api/users/signup', {
        name,
        email,
        password
      });
      
      console.log(data);
      login(data);
      navigate('/');
      
    } catch (error) {
      setError(
        error.response && error.response.data.message 
          ? error.response.data.message 
          : 'Error creating account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className='signup-form' onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input 
            id="name"
            type='text' 
            placeholder="Enter your full name" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input 
            id="email"
            type='email' 
            placeholder="Enter your email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            type='password' 
            placeholder="Create a password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
          />
          <div className="password-requirements">
            Password must be at least 6 characters long
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input 
            id="confirmPassword"
            type='password' 
            placeholder="Confirm your password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type='submit' disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <p className="auth-link">
          Already have an account?{" "}
          <Link to='/signin'>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;