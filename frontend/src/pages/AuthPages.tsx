import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import { useAuth } from '../context/AuthContext'

type Step = 1 | 2 | 3
type Mode = 'login' | 'register'

const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive']
const CONCERNS = ['Acne', 'Dark Spots', 'Wrinkles', 'Dullness', 'Redness', 'Pores']
const SKIN_TONES = ['Very Fair', 'Fair', 'Medium / Wheatish', 'Olive', 'Brown', 'Dark Brown']
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']

const FEATURES = [
  { icon: '🔬', title: 'AI Skin Analysis', desc: 'Detect skin type, tone, acne & more from your selfie' },
  { icon: '💄', title: 'Smart Recommendations', desc: 'Curated products matched to your unique skin profile' },
  { icon: '📈', title: 'Progress Tracking', desc: 'Monitor your skin health over time with visual reports' },
  { icon: '🔒', title: 'Private & Secure', desc: 'Your data and images are never shared or sold' },
]

export default function AuthPages() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [s1, setS1] = useState({ first_name: '', last_name: '', email: '', gender: '' })
  const [s2, setS2] = useState({ skin_type: '', primary_concern: '', skin_tone: '', known_allergies: '' })
  const [s3, setS3] = useState({ password: '', confirm_password: '', terms_agreed: false, marketing: false })
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErrors({})
    try {
      const res = await apiClient.post('/auth/login', loginData)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string | Record<string, unknown> } } }
      
      // Extract error message with better handling
      let errorMsg = 'Invalid email or password.'
      
      if (e.response?.data?.error) {
        const errorData = e.response.data.error
        
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (typeof errorData === 'object' && 'message' in errorData) {
          errorMsg = String(errorData.message)
        }
      }
      
      setErrors({ general: errorMsg })
    } finally { setLoading(false) }
  }

  const validateAndNext = async () => {
    // Client-side validation only - skip server validation
    setLoading(true); setErrors({})
    
    // Validate current step on client side
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!s1.first_name.trim()) newErrors.first_name = 'First name is required'
      if (!s1.last_name.trim()) newErrors.last_name = 'Last name is required'
      if (!s1.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s1.email)) newErrors.email = 'Invalid email address'
      if (!s1.gender) newErrors.gender = 'Gender is required'
    } else if (step === 2) {
      if (!s2.skin_type) newErrors.skin_type = 'Skin type is required'
      if (!s2.primary_concern) newErrors.primary_concern = 'Primary concern is required'
      if (!s2.skin_tone) newErrors.skin_tone = 'Skin tone is required'
    } else if (step === 3) {
      if (!s3.password) newErrors.password = 'Password is required'
      else if (s3.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      if (!s3.terms_agreed) newErrors.terms_agreed = 'You must agree to the Terms of Service'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }
    
    // Move to next step
    setStep(s => (s < 3 ? (s + 1) as Step : s))
    setLoading(false)
  }

  const handleRegister = async () => {
    if (s3.password !== s3.confirm_password) { setErrors({ confirm_password: 'Passwords do not match.' }); return }
    setLoading(true); setErrors({})
    try {
      console.log('Registering user with data:', { step1: s1, step2: s2 })
      const res = await apiClient.post('/auth/register', {
        step1: s1,
        step2: { ...s2, known_allergies: s2.known_allergies.split(',').map(x => x.trim()).filter(Boolean) },
        step3: { password: s3.password, terms_agreed: s3.terms_agreed },
      })
      console.log('Registration successful:', res.data)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { fields?: Record<string, string>; error?: string | Record<string, unknown> }; status?: number }; message?: string }
      console.error('Registration error:', err)
      console.error('Response data:', e.response?.data)
      
      // Extract error message with better handling for various formats
      let errorMsg = 'Registration failed. Please try again.'
      
      if (e.response?.data?.error) {
        const errorData = e.response.data.error
        
        // Handle different error formats
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (typeof errorData === 'object') {
          // If error is an object, try to extract meaningful message
          if ('message' in errorData && typeof errorData.message === 'string') {
            errorMsg = errorData.message
          } else {
            // Fallback: stringify the object
            try {
              errorMsg = JSON.stringify(errorData)
            } catch {
              errorMsg = 'Registration failed with an unknown error format'
            }
          }
        }
      } else if (e.message) {
        errorMsg = e.message
      }
      
      // Set field errors if available
      if (e.response?.data?.fields) {
        setErrors(e.response.data.fields)
      } else {
        setErrors({ general: errorMsg })
      }
      
      // Show user-friendly alert
      alert(`Registration failed: ${errorMsg}`)
    } finally { setLoading(false) }
  }

  const switchMode = (m: Mode) => { setMode(m); setErrors({}); setStep(1) }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel — branding */}
      <div style={{
        width: '45%', background: 'linear-gradient(135deg, #c0392b 0%, #922b21 50%, #641e16 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <span style={{ fontSize: 36 }}>✨</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>GlowAI</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Your skin deserves<br />
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>smart care</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 48, lineHeight: 1.7 }}>
            AI-powered skin analysis and personalized cosmetic recommendations — made just for you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">

          {mode === 'login' ? (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>Welcome back</h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 32 }}>
                Sign in to your GlowAI account
              </p>

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input className={`input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com"
                    value={loginData.email} onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))} />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <input className="input" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                      value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                      style={{ paddingRight: 44 }} />
                    <button type="button" className="input-icon" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁'}</button>
                  </div>
                </div>

                {errors.general && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {errors.general}</div>}

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginBottom: 16 }}>
                  {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
                </button>
              </form>

              <div className="divider">or</div>

              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--gray-500)' }}>
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 14 }}>
                  Create Account
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: step > n ? 'var(--success)' : step === n ? 'var(--primary)' : 'var(--gray-200)',
                      color: step >= n ? '#fff' : 'var(--gray-500)',
                      transition: 'all 0.3s ease',
                    }}>
                      {step > n ? '✓' : n}
                    </div>
                    {n < 3 && <div style={{ width: 32, height: 2, background: step > n ? 'var(--success)' : 'var(--gray-200)', transition: 'all 0.3s ease', borderRadius: 1 }} />}
                  </div>
                ))}
                <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                  {['Basic Info', 'Skin Profile', 'Set Password'][step - 1]}
                </span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>
                {['Tell us about you', 'Your skin profile', 'Secure your account'][step - 1]}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
                {['Step 1 of 3 — Basic information', 'Step 2 of 3 — Help us personalize your experience', 'Step 3 of 3 — Almost done!'][step - 1]}
              </p>

              {/* Step 1 */}
              {step === 1 && (
                <div className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">First Name *</label>
                      <input className={`input ${errors.first_name ? 'error' : ''}`} placeholder="Diya"
                        value={s1.first_name} onChange={e => setS1(d => ({ ...d, first_name: e.target.value }))} />
                      {errors.first_name && <p className="input-error">{errors.first_name}</p>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Last Name *</label>
                      <input className={`input ${errors.last_name ? 'error' : ''}`} placeholder="Tekale"
                        value={s1.last_name} onChange={e => setS1(d => ({ ...d, last_name: e.target.value }))} />
                      {errors.last_name && <p className="input-error">{errors.last_name}</p>}
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address *</label>
                    <input className={`input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com"
                      value={s1.email} onChange={e => setS1(d => ({ ...d, email: e.target.value }))} />
                    {errors.email && <p className="input-error">{errors.email}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Gender *</label>
                    <select className={`input ${errors.gender ? 'error' : ''}`}
                      value={s1.gender} onChange={e => setS1(d => ({ ...d, gender: e.target.value }))}>
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g}>{g}</option>)}
                    </select>
                    {errors.gender && <p className="input-error">{errors.gender}</p>}
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="fade-in">
                  <div className="input-group">
                    <label className="input-label">Your Skin Type *</label>
                    <div className="chip-group">
                      {SKIN_TYPES.map(t => (
                        <button key={t} type="button" className={`chip ${s2.skin_type === t.toLowerCase() ? 'active' : ''}`}
                          onClick={() => setS2(d => ({ ...d, skin_type: t.toLowerCase() }))}>
                          {t}
                        </button>
                      ))}
                    </div>
                    {errors.skin_type && <p className="input-error" style={{ marginTop: 6 }}>{errors.skin_type}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Primary Skin Concern *</label>
                    <div className="chip-group">
                      {CONCERNS.map(c => (
                        <button key={c} type="button" className={`chip ${s2.primary_concern === c.toLowerCase().replace(' ', '_') ? 'active' : ''}`}
                          onClick={() => setS2(d => ({ ...d, primary_concern: c.toLowerCase().replace(' ', '_') }))}>
                          {c}
                        </button>
                      ))}
                    </div>
                    {errors.primary_concern && <p className="input-error" style={{ marginTop: 6 }}>{errors.primary_concern}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Skin Tone *</label>
                    <select className="input" value={s2.skin_tone} onChange={e => setS2(d => ({ ...d, skin_tone: e.target.value }))}>
                      <option value="">Select your skin tone</option>
                      {SKIN_TONES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {errors.skin_tone && <p className="input-error">{errors.skin_tone}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Known Allergies / Sensitivities</label>
                    <input className="input" placeholder="e.g. fragrance, parabens, sulfates"
                      value={s2.known_allergies} onChange={e => setS2(d => ({ ...d, known_allergies: e.target.value }))} />
                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Separate multiple with commas</p>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="fade-in">
                  <div className="input-group">
                    <label className="input-label">Password *</label>
                    <div className="input-wrapper">
                      <input className={`input ${errors.password ? 'error' : ''}`} type={showPw ? 'text' : 'password'}
                        placeholder="Min. 8 characters" value={s3.password}
                        onChange={e => setS3(d => ({ ...d, password: e.target.value }))} style={{ paddingRight: 44 }} />
                      <button type="button" className="input-icon" onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁'}</button>
                    </div>
                    {s3.password && (
                      <div style={{ marginTop: 8 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{
                            width: `${Math.min(100, s3.password.length * 10)}%`,
                            background: s3.password.length < 6 ? '#ef4444' : s3.password.length < 10 ? '#f59e0b' : '#22c55e'
                          }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                          {s3.password.length < 6 ? 'Weak' : s3.password.length < 10 ? 'Good' : 'Strong'} password
                        </p>
                      </div>
                    )}
                    {errors.password && <p className="input-error">{errors.password}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirm Password *</label>
                    <div className="input-wrapper">
                      <input className={`input ${errors.confirm_password ? 'error' : ''}`} type={showConfirmPw ? 'text' : 'password'}
                        placeholder="Repeat your password" value={s3.confirm_password}
                        onChange={e => setS3(d => ({ ...d, confirm_password: e.target.value }))} style={{ paddingRight: 44 }} />
                      <button type="button" className="input-icon" onClick={() => setShowConfirmPw(p => !p)}>{showConfirmPw ? '🙈' : '👁'}</button>
                    </div>
                    {errors.confirm_password && <p className="input-error">{errors.confirm_password}</p>}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                    <input type="checkbox" checked={s3.terms_agreed} onChange={e => setS3(d => ({ ...d, terms_agreed: e.target.checked }))}
                      style={{ marginTop: 3, accentColor: 'var(--primary)', width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                      I agree to the <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Terms of Service</span> and{' '}
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Privacy Policy</span>. I understand my skin images will be used for AI analysis only.
                    </span>
                  </label>
                  {errors.terms_agreed && <p className="input-error" style={{ marginBottom: 8 }}>{errors.terms_agreed}</p>}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={s3.marketing} onChange={e => setS3(d => ({ ...d, marketing: e.target.checked }))}
                      style={{ marginTop: 3, accentColor: 'var(--primary)', width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>
                      Send me personalized skincare tips and product updates.
                    </span>
                  </label>
                </div>
              )}

              {errors.general && <div className="alert alert-error" style={{ marginTop: 16 }}>⚠️ {errors.general}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {step > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(s => (s - 1) as Step)} disabled={loading}>
                    ← Back
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-full" onClick={step < 3 ? validateAndNext : handleRegister} disabled={loading}>
                  {loading ? <><span className="spinner" /> Please wait…</> : step < 3 ? 'Continue →' : '🌟 Create My Account'}
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)', marginTop: 20 }}>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 13 }}>
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
