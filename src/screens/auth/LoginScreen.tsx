import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, Divider, AppFooter } from '../../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  // ─── ESTADO ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'login' | 'token'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{ username?: string; password?: string; token?: string }>({});

  // ─── VALIDACIONES ────────────────────────────────────────────────────────
  const validateLogin = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    if (!password.trim()) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateToken = () => {
    const newErrors: typeof errors = {};
    if (!token.trim()) newErrors.token = 'Ingresa el token proporcionado';
    if (token.trim().length < 6) newErrors.token = 'El token parece muy corto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error de acceso', result.error);
      return;
    }
    // La navegación la maneja el layout raíz según el rol del usuario
  };

  const handleToken = async () => {
    if (!validateToken()) return;
    router.push({ pathname: '/auth/redeem-token', params: { token: token.trim() } });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── LOGO / ENCABEZADO ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="school-outline" size={40} color="#FFF" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>EMAI-APP</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Seguimiento de exámenes
          </Text>
        </View>

        {/* ── TABS LOGIN / TOKEN ────────────────────────────────────────── */}
        <View style={[styles.tabContainer, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              mode === 'login' && { backgroundColor: colors.primary, borderRadius: 10 },
            ]}
            onPress={() => { setMode('login'); setErrors({}); }}
          >
            <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.textSecondary }]}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              mode === 'token' && { backgroundColor: colors.primary, borderRadius: 10 },
            ]}
            onPress={() => { setMode('token'); setErrors({}); }}
          >
            <Text style={[styles.tabText, { color: mode === 'token' ? '#FFF' : colors.textSecondary }]}>
              Ingresar token
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── FORMULARIO LOGIN ──────────────────────────────────────────── */}
        {mode === 'login' && (
          <View style={styles.form}>
            <Input
              label="Usuario"
              placeholder="Nombre de usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              leftIcon={
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              }
            />

            <Input
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              }
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            <Button
              label="Ingresar"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {/* ── FORMULARIO TOKEN ──────────────────────────────────────────── */}
        {mode === 'token' && (
          <View style={styles.form}>
            <View style={[styles.tokenInfo, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.tokenInfoText, { color: colors.primary }]}>
                Ingresa el token que el administrador de EMAI-APP te proporcionó para activar tu institución.
              </Text>
            </View>

            <Input
              label="Token de institución"
              placeholder="Ej: EMAI-XXXX-YYYY"
              value={token}
              onChangeText={(t) => setToken(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              error={errors.token}
              leftIcon={
                <Ionicons name="key-outline" size={18} color={colors.textMuted} />
              }
            />

            <Button
              label="Continuar con token"
              onPress={handleToken}
              loading={loading}
            />
          </View>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <View style={{ flex: 1, justifyContent: 'flex-end', marginTop: 40 }}>
          <AppFooter />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    gap: 0,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tokenInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
