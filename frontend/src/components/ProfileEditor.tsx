import { useState } from 'react'
import apiClient from '../apiClient'
import { useAuth } from '../context/AuthContext'

const SKIN_TYPES = ['oily', 'dry', 'combination', 'normal', 'sensitive']
const CONCERNS = ['acne', 'dark_spots', 'wrinkles', 'dullness', 'redness', 'pores']

export default function ProfileEditor() {
  const { user, login } = useAuth()
  const profile = user?.skin_profile as { skin_type?: string; primary_concern?: string; skin_tone?: string; known_allergies?: string[] } | undefined ?? {}

  const [skinType, setSkinType] = useState(profile.skin_type ?? '')
  const [concern, setConcern] = useState(profile.primary_concern ?? '')
  const [skinTone, setSkinTone] = useState(profile.skin_tone ?? '')
  const [allergies, setAllergies] = useState((profile.known_allergies ?? []).join(', '))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await apiClient.put('/profile/', {
        skin_type: skinType, primary_concern: concern, skin_tone: skinTone,
        known_allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      })
      login(res.data, localStorage.getItem('glowai_token') ?? '')
      setSuccess(true)
      await apiClient.post('/recommendations/refresh').catch(() => {})
      setTimeout(() => setSuccess(false), 3000)
    } catch { setError('Failed to update profile.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="input-group">
        <label className="input-label">Skin Type</label>
        <div className="chip-group">
          {SKIN_TYPES.map(t => (
            <button key={t} type="button" className={`chip ${skinType === t ? 'active' : ''}`}
              onClick={() => setSkinType(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Primary Concern</label>
        <div className="chip-group">
          {CONCERNS.map(c => (
            <button key={c} type="button" className={`chip ${concern === c ? 'active' : ''}`}
              onClick={() => setConcern(c)} style={{ textTransform: 'capitalize' }}>{c.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Skin Tone</label>
        <input className="input" value={skinTone} onChange={e => setSkinTone(e.target.value)} placeholder="e.g. Medium / Wheatish" />
      </div>

      <div className="input-group">
        <label className="input-label">Known Allergies</label>
        <input className="input" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. fragrance, parabens" />
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Separate with commas</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>✅ Profile updated! Recommendations refreshed.</div>}

      <button onClick={save} disabled={loading} className="btn btn-primary">
        {loading ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
      </button>
    </div>
  )
}
