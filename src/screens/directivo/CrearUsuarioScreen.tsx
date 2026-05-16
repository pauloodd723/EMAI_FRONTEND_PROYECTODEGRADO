import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';
import { DIRECTIVO_SUB_ROLES } from '@/src/constants';

export default function CrearUsuarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'docente' ? 'docente' : 'directivo';
  const { colors } = useTheme();
  const { request, loading } = useApi();

  const isDocente = mode === 'docente';
  const title = isDocente ? 'Crear docente' : 'Crear directivo';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [subRole, setSubRole] = useState('director');
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

    const body = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase().replace(/\s/g, '_'),
      password,
      role: isDocente ? 'docente' : 'directivo',
      ...(!isDocente ? { subRole } : {}),
    };

    const result = await request('/directivo/usuarios', { method: 'POST', body });

    if (result) {
      Alert.alert(
        '✓ Usuario creado',
        `La cuenta "${fullName}" fue creada exitosamente.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', 'No se pudo crear el usuario. El nombre de usuario puede estar en uso.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title={title} showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={[styles.roleBanner, { backgroundColor: `${colors.primary}0E` }]}>
          <Ionicons name={isDocente ? 'school-outline' : 'people-circle-outline'} size={22} color={colors.primary} />
          <Text style={[styles.roleBannerText, { color: colors.primary }]}>
            {isDocente
              ? 'El docente podrá gestionar estudiantes y exámenes en sus cursos asignados.'
              : 'El directivo tendrá acceso de supervisión a toda la institución.'}
          </Text>
        </View>

        <SectionLabel label="Datos personales" colors={colors} />
        <Input label="Nombre completo" placeholder="Ej: José Martínez" value={fullName} onChangeText={setFullName}
          error={errors.fullName} leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />
        <Input label="Nombre de usuario" placeholder="Ej: jose_martinez" value={username}
          onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, '_'))}
          autoCapitalize="none" autoCorrect={false} error={errors.username}
          leftIcon={<Ionicons name="at-outline" size={18} color={colors.textMuted} />} />

        <SectionLabel label="Contraseña" colors={colors} />
        <Input label="Contraseña" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword}
          secureTextEntry={!showPassword} error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          } />
        <Input label="Confirmar contraseña" placeholder="Repite la contraseña" value={confirmPassword}
          onChangeText={setConfirmPassword} secureTextEntry={!showPassword} error={errors.confirm}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />} />

        {!isDocente && (
          <>
            <SectionLabel label="Rol interno" colors={colors} />
            <View style={styles.rolesGrid}>
              {DIRECTIVO_SUB_ROLES.map((r) => (
                <TouchableOpacity key={r.value}
                  style={[styles.roleChip, { borderColor: colors.border, backgroundColor: colors.surface },
                    subRole === r.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSubRole(r.value)}>
                  <Text style={[styles.roleChipText, { color: subRole === r.value ? '#FFF' : colors.textSecondary }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button label={`Crear ${isDocente ? 'docente' : 'directivo'}`} onPress={handleCreate} loading={loading} style={{ marginTop: 24 }} />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" />
        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.textMuted, marginTop: 16, marginBottom: 12 }}>{label.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  roleBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginTop: 16, marginBottom: 4 },
  roleBannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  roleChipText: { fontSize: 13, fontWeight: '600' },
});
