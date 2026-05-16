import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, AppFooter } from '../../components/ui';

type Step = 'validating' | 'invalid' | 'create_account';

export default function RedeemTokenScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { redeemToken, createAccountWithToken } = useAuth();
  const { colors } = useTheme();

  // ─── ESTADO ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('validating');
  const [institutionName, setInstitutionName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirm?: string }>({});

  // ─── VALIDAR TOKEN AL MONTAR ─────────────────────────────────────────────
  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    const result = await redeemToken(token);
    if (result.success && result.requiresAccountCreation) {
      setInstitutionName(result.institutionName ?? '');
      setStep('create_account');
    } else {
      setErrorMessage(result.error ?? 'Token inválido');
      setStep('invalid');
    }
  };

  // ─── VALIDACIÓN FORMULARIO ────────────────────────────────────────────────
  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    if (username.trim().length < 4) newErrors.username = 'Mínimo 4 caracteres';
    if (!password) newErrors.password = 'La contraseña es requerida';
    if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) newErrors.confirm = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── CREAR CUENTA ─────────────────────────────────────────────────────────
  const handleCreateAccount = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await createAccountWithToken(username.trim(), password, token);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
      return;
    }
    // El layout raíz redirige según rol automáticamente
  };

  // ─── ESTADOS VISUALES ────────────────────────────────────────────────────
  if (step === 'validating') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.validatingText, { color: colors.textSecondary }]}>
          Validando token...
        </Text>
      </View>
    );
  }

  if (step === 'invalid') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.errorIcon, { backgroundColor: `${colors.error}15` }]}>
          <Ionicons name="close-circle-outline" size={48} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Token inválido</Text>
        <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{errorMessage}</Text>
        <Button
          label="Volver al inicio"
          onPress={() => router.replace('/auth/login')}
          variant="outline"
          style={{ marginTop: 24, width: 200 }}
          fullWidth={false}
        />
      </View>
    );
  }

  // ─── CREAR CUENTA ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={[styles.successIcon, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>¡Token válido!</Text>
          {institutionName ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Institución: <Text style={{ fontWeight: '700', color: colors.primary }}>{institutionName}</Text>
            </Text>
          ) : null}
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            Crea tu cuenta de directivo. Solo necesitas un nombre de usuario y contraseña.
          </Text>
        </View>

        {/* FORMULARIO */}
        <View style={styles.form}>
          <Input
            label="Nombre de usuario"
            placeholder="Ej: director_jose"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.username}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
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

          <Input
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            error={errors.confirm}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          />

          {/* TÉRMINOS */}
          <View style={[styles.termsBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              Al crear tu cuenta aceptas los{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => router.push('/auth/data-terms')}
              >
                términos de tratamiento de datos
              </Text>
              {' '}de EMAI-APP.
            </Text>
          </View>

          <Button
            label="Crear mi cuenta"
            onPress={handleCreateAccount}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <Button
            label="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>

        <View style={{ marginTop: 32 }}>
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
    paddingTop: 56,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  validatingText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  errorDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {},
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
