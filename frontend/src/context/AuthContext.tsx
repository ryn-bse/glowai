import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import apiClient from '../apiClient'

interface User {
  _id: string
  email: string
  first_name: string
  last_name: string
  skin_profile: {
    skin_type: string
    primary_concern: string
    skin_tone: string
    known_allergies: string[]
  }
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

type AuthAction =
  | { type: 'LOGIN'; user: User; token: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; loading: boolean }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('glowai_token'),
  loading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('glowai_token', action.token)
      return { user: action.user, token: action.token, loading: false }
    case 'LOGOUT':
      localStorage.removeItem('glowai_token')
      return { user: null, token: null, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem('glowai_token')
    if (!token) {
      dispatch({ type: 'SET_LOADING', loading: false })
      return
    }
    apiClient.get('/auth/me')
      .then((res) => dispatch({ type: 'LOGIN', user: res.data, token }))
      .catch(() => dispatch({ type: 'LOGOUT' }))
  }, [])

  const login = (user: User, token: string) => dispatch({ type: 'LOGIN', user, token })
  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {})
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
