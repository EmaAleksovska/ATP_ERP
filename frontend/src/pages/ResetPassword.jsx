import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import './Login.css'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(token, password)
      setMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Reset Password</h1>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div style={{ background: '#efe', color: '#3c3', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !token}
              minLength={8}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || !token}
              minLength={8}
            />
          </div>
          
          <button type="submit" disabled={loading || !token} className="btn-primary">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="login-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

