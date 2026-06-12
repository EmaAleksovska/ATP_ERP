import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import './Login.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await authService.forgotPassword(email)
      setMessage('If an account with that email exists, a password reset link has been sent.')
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Forgot Password</h1>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div style={{ background: '#efe', color: '#3c3', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="login-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

