import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User, Institution } from '../types';
import { STORAGE_KEYS, API_BASE_URL } from '../constants';

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  redeemToken: (token: string) => Promise<{ success: boolean; error?: string; requiresAccountCreation?: boolean; institutionName?: string }>;
  createAccountWithToken: (username: string, password: string, token: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
  updateInstitution: (updates: Partial<Institution>) => void;
}

const initialState: AuthState = {
  user: null,
  institution: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

type AuthAction =
  | { type: 'RESTORE_SESSION'; payload: { user: User; institution: Institution | null; token: string } }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; institution: Institution | null; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_INSTITUTION'; payload: Partial<Institution> };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_SESSION':
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        institution: action.payload.institution,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    case 'UPDATE_INSTITUTION':
      return { ...state, institution: state.institution ? { ...state.institution, ...action.payload } : null };
    default:
      return state;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function normalizeUser(raw: any): User {
  return {
    ...raw,
    fullName: raw.fullName ?? raw.full_name ?? raw.username ?? '',
    institutionId: raw.institutionId ?? raw.institution_id ?? null,
    courseId: raw.courseId ?? raw.course_id ?? null,
    photoUrl: raw.photoUrl ?? raw.photo_url ?? null,
    subRole: raw.subRole ?? raw.sub_role ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

function normalizeInstitution(raw: any): Institution | null {
  if (!raw) return null;
  return {
    ...raw,
    primaryColor: raw.primaryColor ?? raw.primary_color ?? '#1A3C5E',
    secondaryColor: raw.secondaryColor ?? raw.secondary_color ?? '#2E6DA4',
    dataTermsAccepted: raw.dataTermsAccepted ?? raw.data_terms_accepted ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => { restoreSession(); }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      const institutionData = await SecureStore.getItemAsync(STORAGE_KEYS.INSTITUTION);
      if (token && userData) {
        const user = normalizeUser(JSON.parse(userData));
        const institution = institutionData ? normalizeInstitution(JSON.parse(institutionData)) : null;
        dispatch({ type: 'RESTORE_SESSION', payload: { user, institution, token } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.detail || 'Credenciales incorrectas' };

      const user = normalizeUser(data.user);
      const institution = normalizeInstitution(data.institution);

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.INSTITUTION, JSON.stringify(institution));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, institution, token: data.access_token } });
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu red.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.INSTITUTION);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const redeemToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/redeem-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.detail || 'Token inválido o ya utilizado' };
      return {
        success: true,
        requiresAccountCreation: true,
        institutionName: data.institution_name,
      };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu red.' };
    }
  }, []);

  const createAccountWithToken = useCallback(async (username: string, password: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, token }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.detail || 'Error al crear la cuenta' };

      const user = normalizeUser(data.user);
      const institution = normalizeInstitution(data.institution);

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.INSTITUTION, JSON.stringify(institution));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, institution, token: data.access_token } });
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión. Verifica tu red.' };
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const updateInstitution = useCallback((updates: Partial<Institution>) => {
    dispatch({ type: 'UPDATE_INSTITUTION', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state, login, logout, redeemToken,
      createAccountWithToken, updateUser, updateInstitution,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
