import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../apiClient'
import { useAuth } from '../context/AuthContext'
import { useAnalysis, type Analysis } from '../context/AnalysisContext'
import ImageCapture from './ImageCapture'
import RecommendationCard from './RecommendationCard'
import AnalysisDetail from './AnalysisDetail'
import ProfileEditor from './ProfileEditor'

type Tab = 'overview' | 'analyze' | 'history' | 'profile'

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'analyze', icon: '🔬', label: 'Analyze' },
  { id: 'history', icon: '📋', label: 'History' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, loading: authLoading } = useAuth()
  const { current, history, setHistory, addAnalysis } = useAnalysis()
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    setLoadingHistory(true)
    apiClient.get('/analysis/history')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [user, setHistory])

  useEffect(() => {
    if (!current) return
    apiClient.get('/recommendations/current')
      .then(res => {
        const recs = res.data.recommendations ?? []
        if (recs.length > 0) {
          apiClient.get('/products/').then(pRes => {
            const all = pRes.data as Record<string, unknown>[]
            const ids = recs.map((r: { product_id: string }) => r.product_id)
            const matched = all
              .filter(p => ids.includes(p._id as string))
              .map(p => {
                const rec = recs.find((r: { product_id: string; compatibility_score: number; rank: number }) => r.product_id === p._id)
                return { ...p, compatibility_score: rec?.compatibility_score, rank: rec?.rank }
              })
              .sort((a, b) => ((a.rank as number) ?? 99) - ((b.rank as number) ?? 99))
            setProducts(matched)
          }).catch(() => {})
        }
      }).catch(() => {})
  }, [current])

  const handleAnalysisComplete = (result: unknown) => {
    addAnalysis(result as Analysis)
    setTab('overview')
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Loading GlowAI…</p>
      </div>
    </div>
  )
  if (!user) return null

  const skinProfile = user.skin_profile ?? {}

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 72, flexShrink: 0,
        background: 'var(--white)', borderRight: '1px solid var(--gray-200)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease', overflow: 'hidden',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>✨</span>
          {sidebarOpen && <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>GlowAI</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSelectedAnalysis(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius)', border: 'none',
                background: tab === item.id ? 'var(--primary-bg)' : 'transparent',
                color: tab === item.id ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: tab === item.id ? 600 : 400,
                fontSize: 14, cursor: 'pointer', transition: 'var(--transition)',
                marginBottom: 2, fontFamily: 'inherit', textAlign: 'left',
              }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--gray-100)' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {user.first_name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.first_name} {user.last_name}</p>
                <p style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px', borderRadius: 'var(--radius)', border: 'none',
            background: 'transparent', color: 'var(--gray-500)', fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🚪</span>
            {sidebarOpen && 'Sign out'}
          </button>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-end' : 'center',
            padding: '8px 12px', borderRadius: 'var(--radius)', border: 'none',
            background: 'transparent', color: 'var(--gray-400)', fontSize: 18,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>
              {NAV_ITEMS.find(n => n.id === tab)?.icon} {NAV_ITEMS.find(n => n.id === tab)?.label}
            </h1>
          </div>
          {tab === 'analyze' && (
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Upload a clear, well-lit selfie for best results</p>
          )}
        </header>

        <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>

          {/* OVERVIEW */}
          {tab === 'overview' && !selectedAnalysis && (
            <div className="fade-in">
              {/* Welcome banner */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #922b21 100%)',
                borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 28,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: '#fff', overflow: 'hidden', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div>
                  <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Good day,</p>
                  <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                    {user.first_name} {user.last_name} ✨
                  </h2>
                  <p style={{ fontSize: 14, opacity: 0.8 }}>
                    {current ? `Last analysis: ${new Date(current.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Start your first skin analysis today'}
                  </p>
                </div>
                <button onClick={() => setTab('analyze')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', flexShrink: 0 }}>
                  {current ? '🔬 New Analysis' : '🔬 Start Analysis'}
                </button>
              </div>

              {current ? (
                <>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                    {[
                      { label: 'Skin Type', value: current.skin_type, icon: '🧴', sub: `${(current.skin_type_confidence * 100).toFixed(0)}% confidence` },
                      { label: 'Conditions Found', value: current.conditions.length === 0 ? 'Clear ✓' : `${current.conditions.length} detected`, icon: '🔍', sub: current.conditions.map(c => c.name.replace('_', ' ')).join(', ') || 'No issues detected' },
                      { label: 'Analyses Done', value: history.length, icon: '📊', sub: 'Total scans' },
                    ].map(stat => (
                      <div key={stat.label} className="card">
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, fontWeight: 500 }}>{stat.label}</p>
                              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', textTransform: 'capitalize', marginBottom: 4 }}>{stat.value}</p>
                              <p style={{ fontSize: 12, color: 'var(--gray-400)', textTransform: 'capitalize' }}>{stat.sub}</p>
                            </div>
                            <span style={{ fontSize: 28 }}>{stat.icon}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Latest analysis card */}
                  <div className="card" style={{ marginBottom: 28 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>Latest Analysis</h3>
                      <button onClick={() => setSelectedAnalysis(current)} className="btn btn-ghost btn-sm">View Details →</button>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Skin Type</p>
                          <span className="badge badge-red" style={{ fontSize: 13, padding: '4px 12px', textTransform: 'capitalize' }}>{current.skin_type}</span>
                        </div>
                        {current.conditions.length > 0 && (
                          <div style={{ flex: 2 }}>
                            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Detected Conditions</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {current.conditions.map(c => (
                                <span key={c.name} className="badge badge-yellow" style={{ textTransform: 'capitalize' }}>
                                  {c.name.replace('_', ' ')} · {(c.confidence * 100).toFixed(0)}%
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {current.low_confidence_flag && (
                          <div className="alert alert-info" style={{ width: '100%', marginTop: 8 }}>
                            ℹ️ Low confidence result — try a clearer, well-lit photo for better accuracy.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {products.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recommended for You</h3>
                        <span className="badge badge-gray">{products.length} products</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {products.slice(0, 5).map((p, i) => (
                          <RecommendationCard key={String(p._id ?? i)} product={p as Parameters<typeof RecommendationCard>[0]['product']} rank={p.rank as number} compatibilityScore={p.compatibility_score as number} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🔬</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No analysis yet</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                    Upload a selfie to get your personalized skin analysis and product recommendations.
                  </p>
                  <button onClick={() => setTab('analyze')} className="btn btn-primary btn-lg">
                    🔬 Start Your First Analysis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW — detail view */}
          {tab === 'overview' && selectedAnalysis && (
            <div className="fade-in">
              <AnalysisDetail analysis={selectedAnalysis} onBack={() => setSelectedAnalysis(null)} />
            </div>
          )}

          {/* ANALYZE */}
          {tab === 'analyze' && (
            <div className="fade-in">
              <ImageCapture onAnalysisComplete={handleAnalysisComplete} />
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div className="fade-in">
              {selectedAnalysis ? (
                <AnalysisDetail analysis={selectedAnalysis} onBack={() => setSelectedAnalysis(null)} />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Analysis History</h2>
                    <span className="badge badge-gray">{history.length} total</span>
                  </div>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto' }} />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                      <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>No analyses yet. Go to Analyze to get started.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {history.map(a => (
                        <div key={a._id} className="card card-hover" onClick={() => setSelectedAnalysis(a)}>
                          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize', marginBottom: 2 }}>{a.skin_type} Skin</p>
                                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                                  {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {a.conditions.length > 0 ? (
                                <span className="badge badge-yellow">{a.conditions.length} condition{a.conditions.length > 1 ? 's' : ''}</span>
                              ) : (
                                <span className="badge badge-green">Clear skin ✓</span>
                              )}
                              <span style={{ color: 'var(--gray-400)', fontSize: 18 }}>›</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PROFILE */}
          {tab === 'profile' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
                {/* Profile summary card */}
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 auto 12px' }}>
                      {user.first_name?.[0]?.toUpperCase()}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{user.first_name} {user.last_name}</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{user.email}</p>
                    {skinProfile.skin_type && (
                      <span className="badge badge-red" style={{ textTransform: 'capitalize', fontSize: 13 }}>
                        {skinProfile.skin_type} skin
                      </span>
                    )}
                    <div style={{ marginTop: 16, textAlign: 'left' }}>
                      {skinProfile.primary_concern && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                          <span style={{ color: 'var(--gray-500)' }}>Main concern</span>
                          <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{skinProfile.primary_concern?.replace('_', ' ')}</span>
                        </div>
                      )}
                      {skinProfile.skin_tone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                          <span style={{ color: 'var(--gray-500)' }}>Skin tone</span>
                          <span style={{ fontWeight: 500 }}>{skinProfile.skin_tone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Editor */}
                <div className="card">
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>Edit Skin Profile</h3>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>Keep your profile updated for better recommendations</p>
                  </div>
                  <div className="card-body">
                    <ProfileEditor />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
