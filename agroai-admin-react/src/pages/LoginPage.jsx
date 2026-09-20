import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginAdmin } from '../services/api.js'
import { LuShieldAlert, LuEye, LuEyeOff, LuLock, LuMail, LuArrowRight, LuSparkles } from 'react-icons/lu'
import agroAiLogo from '../assets/agroai.png'
import './LoginPage.css'

export default function LoginPage() {
  const { login, isAdmin, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (token && isAdmin) {
      navigate(from, { replace: true })
    }
  }, [token, isAdmin, navigate, from])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and security access key are required.')
      return
    }

    setLoading(true)
    try {
      const data = await loginAdmin(email.trim(), password)
      
      if (data.role !== 'admin' && data.user?.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.')
      }

      const authToken = data.token
      let userPayload = data.user

      if (!userPayload && authToken) {
        try {
          userPayload = JSON.parse(atob(authToken.split('.')[1]))
        } catch {
          userPayload = { email: email.trim(), role: data.role || 'admin' }
        }
      }

      login(authToken, userPayload)
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot reach authentication cluster. Ensure backend services are active.')
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-ambient-grid" />
      <div className="login-glow-center" />
      <div className="login-glow-bottom" />

      <div className="login-wrap">
        <header className="login-header">
          <div className="login-logo-container">
            <div className="logo-glow" />
            <img src={agroAiLogo} alt="AgroAI" className="logo-img" />
          </div>

          <div className="login-pill">
            <span className="login-pulse-dot" />
            <span className="login-pill-text">ENTERPRISE CONSOLE</span>
          </div>

          <h1 className="login-title">
            AgroAI <span className="title-highlight">Admin</span>
          </h1>
          <p className="login-subtitle">Intelligent Agronomy Infrastructure Control</p>
        </header>

        <form className="login-card" onSubmit={handleLogin} noValidate>
          <div className="card-ambient-light" />

          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              <span>ADMINISTRATOR IDENTITY</span>
            </label>
            <div className="input-box">
              <LuMail className="input-icon" />
              <input
                id="admin-email"
                className="form-input"
                type="email"
                placeholder="admin@agroai.internal"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              <span>SECURITY ACCESS KEY</span>
            </label>
            <div className="input-box">
              <LuLock className="input-icon" />
              <input
                id="admin-password"
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                title={showPw ? 'Hide access key' : 'Show access key'}
              >
                {showPw ? <LuEyeOff size={16} /> : <LuEye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              <LuShieldAlert size={16} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="submit-spinner" />
                <span>Authenticating Node...</span>
              </>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <LuArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <footer className="login-footer">
          <div className="footer-status">
            <LuSparkles size={12} color="#10B981" />
            <span>AGROAI OS v2.4 · SECURE NODE ONLINE</span>
          </div>
        </footer>
      </div>
    </div>
  )
}