interface Product {
  _id?: string; name?: string; brand?: string; category?: string
  ingredients?: string[]; image_url?: string
  compatibility_score?: number; rank?: number
}

interface RecommendationCardProps {
  product: Product; rank?: number; compatibilityScore?: number
}

const CATEGORY_ICONS: Record<string, string> = {
  cleanser: '🧼', moisturizer: '💧', serum: '✨', sunscreen: '☀️',
  toner: '🌿', treatment: '💊', mask: '🎭',
}

export default function RecommendationCard({ product, rank, compatibilityScore }: RecommendationCardProps) {
  const score = compatibilityScore ?? product.compatibility_score ?? 0
  const scorePct = Math.round(score * 100)
  const scoreColor = score >= 0.7 ? '#16a34a' : score >= 0.4 ? '#d97706' : '#dc2626'
  const scoreBg = score >= 0.7 ? '#f0fdf4' : score >= 0.4 ? '#fffbeb' : '#fef2f2'
  const keyIngredients = (product.ingredients ?? []).slice(0, 3)
  const icon = CATEGORY_ICONS[product.category ?? ''] ?? '🧴'

  return (
    <div className="card" style={{ transition: 'var(--transition)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}>
      <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Rank */}
        {rank && (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: rank <= 3 ? 'var(--primary)' : 'var(--gray-100)', color: rank <= 3 ? '#fff' : 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {rank}
          </div>
        )}

        {/* Product image / icon */}
        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius)', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
          {product.image_url && !product.image_url.includes('placeholder') ? (
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name ?? 'Unknown Product'}
              </p>
              {product.brand && <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{product.brand}</p>}
            </div>
            <div style={{ background: scoreBg, color: scoreColor, padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {scorePct}% match
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {product.category && (
              <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{product.category}</span>
            )}
            {keyIngredients.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                {keyIngredients.join(' · ')}
              </span>
            )}
          </div>

          {/* Score bar */}
          <div style={{ marginTop: 8 }}>
            <div className="progress-bar" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${scorePct}%`, background: scoreColor }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
