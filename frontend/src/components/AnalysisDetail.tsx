import { type Analysis } from '../context/AnalysisContext'
import ReportViewer from './ReportViewer'

interface AnalysisDetailProps { analysis: Analysis; onBack?: () => void }

const CONDITION_META: Record<string, { label: string; icon: string }> = {
  acne:           { label: 'Acne',           icon: '🔴' },
  dark_spots:     { label: 'Dark Spots',     icon: '🟤' },
  enlarged_pores: { label: 'Enlarged Pores', icon: '🔵' },
  wrinkles:       { label: 'Wrinkles',       icon: '〰️' },
}

export default function AnalysisDetail({ analysis, onBack }: AnalysisDetailProps) {
  const date = new Date(analysis.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const confidence = Math.round(analysis.skin_type_confidence * 100)

  return (
    <div className="fade-in">
      {onBack && (
        <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: 20, paddingLeft: 0 }}>
          ← Back
        </button>
      )}

      {/* Header card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--primary-bg) 0%, #fff 100%)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Analysis Result · {date}</p>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize', marginBottom: 10 }}>
                {analysis.skin_type} Skin
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${confidence}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>{confidence}% confidence</span>
                {analysis.low_confidence_flag && <span className="badge badge-yellow">⚠ Low confidence</span>}
              </div>
            </div>
            <ReportViewer analysisId={analysis._id} />
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Detected Conditions</h3>
        </div>
        <div className="card-body">
          {analysis.conditions.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--success)', fontSize: 14 }}>No significant conditions detected</p>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Your skin looks healthy!</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.conditions.map(cond => {
                const meta = CONDITION_META[cond.name] ?? { label: cond.name, icon: '🔍' }
                const conf = Math.round(cond.confidence * 100)
                const severity = conf >= 70 ? 'High' : conf >= 40 ? 'Moderate' : 'Low'
                const severityColor = conf >= 70 ? 'var(--error)' : conf >= 40 ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={cond.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                    <span style={{ fontSize: 22 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{meta.label}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: severityColor, fontWeight: 600 }}>{severity}</span>
                          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{conf}%</span>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${conf}%`, background: severityColor }} />
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                        Region: {cond.bbox.region.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Face regions */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Analyzed Regions</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {['Forehead', 'Left Cheek', 'Right Cheek', 'Chin'].map(region => (
              <div key={region} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🎯</div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-700)' }}>{region}</p>
                <span className="badge badge-green" style={{ marginTop: 4, fontSize: 10 }}>Scanned</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
