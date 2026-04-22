import { createContext, useContext, useReducer, type ReactNode } from 'react'

interface Condition {
  name: string
  confidence: number
  bbox: { region: string; x: number; y: number; w: number; h: number }
}

interface Recommendation {
  product_id: string
  compatibility_score: number
  rank: number
}

export interface Analysis {
  _id: string
  created_at: string
  skin_type: string
  skin_type_confidence: number
  low_confidence_flag: boolean
  conditions: Condition[]
  recommendations: Recommendation[]
  image_url: string
}

interface AnalysisState {
  current: Analysis | null
  history: Analysis[]
}

type AnalysisAction =
  | { type: 'SET_CURRENT'; analysis: Analysis }
  | { type: 'SET_HISTORY'; history: Analysis[] }
  | { type: 'ADD_ANALYSIS'; analysis: Analysis }

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'SET_CURRENT':
      return { ...state, current: action.analysis }
    case 'SET_HISTORY':
      return { ...state, history: action.history, current: action.history[0] ?? null }
    case 'ADD_ANALYSIS':
      return { current: action.analysis, history: [action.analysis, ...state.history] }
    default:
      return state
  }
}

interface AnalysisContextValue extends AnalysisState {
  setCurrent: (a: Analysis) => void
  setHistory: (h: Analysis[]) => void
  addAnalysis: (a: Analysis) => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, { current: null, history: [] })

  return (
    <AnalysisContext.Provider value={{
      ...state,
      setCurrent: (a) => dispatch({ type: 'SET_CURRENT', analysis: a }),
      setHistory: (h) => dispatch({ type: 'SET_HISTORY', history: h }),
      addAnalysis: (a) => dispatch({ type: 'ADD_ANALYSIS', analysis: a }),
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}
