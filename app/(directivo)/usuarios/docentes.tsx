import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';

export default function CrearDocentePage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { request, loading } = useApi();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Requerido';
    if (!username.trim() || username.length < 4) e.username = 'Mínimo 4 caracteres';
    if (!password || password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const result = await request('/directivo/usuarios', {
      method: 'POST',
      body: {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase().replace(/\s/g, '_'),
        password,
        role: 'docente',
      },
    });
    if (result) {
      Alert.alert('✓ Docente creado', `La cuenta "${fullName}" fue creada.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo crear. El usuario puede estar en uso.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Crear docente" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { backgroundColor: `${colors.primary}0E` }]}>
          <Ionicons name="school-outline" size={22} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>
            El docente podrá gestionar estudiantes y exámenes en sus cursos asignados.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>DATOS PERSONALES</Text>
        <Input label="Nombre completo" placeholder="Ej: María González" value={fullName}
          onChangeText={setFullName} error={errors.fullName}
          leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />
        <Input label="Nombre de usuario" placeholder="Ej: maria_gonzalez" value={username}
          onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, '_'))}
          autoCapitalize="none" autoCorrect={false} error={errors.username}
          leftIcon={<Ionicons name="at-outline" size={18} color={colors.textMuted} />} />

        <Text style={[styles.label, { color: colors.textMuted }]}>CONTRASEÑA</Text>
        <Input label="Contraseña" placeholder="Mínimo 6 caracteres" value={password}
          onChangeText={setPassword} secureTextEntry={!showPassword} error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          } />
        <Input label="Confirmar contraseña" placeholder="Repite la contraseña" value={confirmPassword}
          onChangeText={setConfirmPassword} secureTextEntry={!showPassword} error={errors.confirm}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />} />

        <Button label="Crear docente" onPress={handleCreate} loading={loading} style={{ marginTop: 24 }} />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" />
        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginTop: 16, marginBottom: 4 },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 16, marginBottom: 12 },
});
