import { useState } from 'react'
import apiClient from '../apiClient'

export default function ReportViewer({ analysisId }: { analysisId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const download = async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiClient.get(`/report/${analysisId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `glowai-report-${analysisId.slice(0, 8)}.pdf`; a.click()
      URL.revokeObjectURL(url)
      setDone(true); setTimeout(() => setDone(false), 3000)
    } catch {
      setError('Failed to generate report.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <button onClick={download} disabled={loading} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
        {loading ? <><span className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> Generating…</>
          : done ? '✅ Downloaded!'
          : '📄 Download PDF'}
      </button>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <p style={{ fontSize: 12, color: 'var(--error)' }}>{error}</p>
          <button onClick={download} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}
    </div>
  )
}
