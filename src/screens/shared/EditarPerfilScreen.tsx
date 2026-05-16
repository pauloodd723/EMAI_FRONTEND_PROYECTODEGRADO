import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, Badge, AppFooter } from '@/src/components/ui';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const { request, loading } = useApi();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoUrl ?? null);
  const [convertingPhoto, setConvertingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'El nombre es requerido';
    if (password && password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password && password !== confirmPassword) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setConvertingPhoto(true);
      try {
        const FS = require('expo-file-system');
        const b64 = await FS.readAsStringAsync(result.assets[0].uri, {
          encoding: 'base64',
        });
        const mimeType = result.assets[0].mimeType ?? 'image/jpeg';
        setPhotoUri(`data:${mimeType};base64,${b64}`);
      } catch {
        setPhotoUri(result.assets[0].uri);
      }
      setConvertingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    const body: Record<string, string> = {
      fullName: fullName.trim(),
    };
    if (password) body.password = password;
    if (photoUri !== null) body.photoUrl = photoUri;

    const result = await request('/auth/perfil', { method: 'PATCH', body });
    if (result) {
      updateUser({
        fullName: fullName.trim(),
        photoUrl: photoUri ?? undefined,
      });
      Alert.alert('✓ Guardado', 'Tu perfil fue actualizado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    directivo: 'Directivo',
    docente: 'Docente',
  };

  const initials = (user?.fullName ?? user?.username ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Editar perfil" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* FOTO */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85} style={styles.photoTouch}>
            {convertingPhoto ? (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                <ActivityIndicator color="#FFF" size="large" />
              </View>
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.photoInitials}>{initials}</Text>
              </View>
            )}
            <View style={[styles.photoOverlay, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: colors.textMuted }]}>
            Toca para cambiar foto
          </Text>
          <View style={styles.roleBadgeRow}>
            <Badge label={roleLabel[user?.role ?? ''] ?? (user?.role ?? '')} variant="info" />
            {user?.subRole && <Badge label={user.subRole} variant="default" />}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DATOS PERSONALES</Text>

        <Input
          label="Nombre completo"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
        />

        <View style={[styles.infoRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Ionicons name="at-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Usuario</Text>
          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>@{user?.username}</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CAMBIAR CONTRASEÑA</Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
          Deja vacío para no cambiarla.
        </Text>

        <Input
          label="Nueva contraseña"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPw}
          error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          }
        />

        <Input
          label="Confirmar nueva contraseña"
          placeholder="Repite la contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPw}
          error={errors.confirm}
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
        />

        <Button label="Guardar cambios" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" />

        <View style={{ marginTop: 32 }}>
          <AppFooter />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  photoSection: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  photoTouch: { position: 'relative' },
  photoImg: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  photoInitials: { color: '#FFF', fontSize: 30, fontWeight: '700' },
  photoOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  photoHint: { fontSize: 13 },
  roleBadgeRow: { flexDirection: 'row', gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginTop: 16, marginBottom: 12,
  },
  sectionHint: { fontSize: 12, marginTop: -8, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: 14, marginBottom: 16,
  },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600' },
});
