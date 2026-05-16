import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  ScrollView, Alert, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, Avatar, Badge, AppFooter } from '@/src/components/ui';

export default function AdminsScreen() {
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqDelete } = useApi();

  const [admins, setAdmins] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAdmins = useCallback(async () => {
    const data = await request('/admin/admins');
    if (data) setAdmins(data);
  }, [request]);

  useEffect(() => { fetchAdmins(); }, []);
  useAutoRefresh(fetchAdmins);

  const handleDelete = (adminId: string, adminName: string) => {
    if (adminId === currentUser?.id) {
      Alert.alert('No permitido', 'No puedes eliminar tu propia cuenta.');
      return;
    }
    Alert.alert(
      'Eliminar administrador',
      `¿Eliminar a "${adminName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await reqDelete(`/admin/admins/${adminId}`, { method: 'DELETE' });
            fetchAdmins();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Administradores" showBack />
      <FlatList
        data={admins}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchAdmins();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Button
            label="+ Agregar administrador"
            onPress={() => setShowCreate(true)}
            style={{ marginBottom: 12 }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay otros administradores.
            </Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const isMe: boolean = item.id === currentUser?.id;
          const name: string = item.fullName ?? item.full_name ?? item.username ?? '?';
          const createdAt: string | undefined = item.createdAt ?? item.created_at;
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Avatar name={name} size={46} />
              <View style={styles.rowInfo}>
                <View style={styles.rowNameRow}>
                  <Text style={[styles.rowName, { color: colors.textPrimary }]}>{name}</Text>
                  {isMe && <Badge label="Tú" variant="info" />}
                </View>
                <Text style={[styles.rowUsername, { color: colors.textSecondary }]}>
                  @{item.username}
                </Text>
                <Text style={[styles.rowDate, { color: colors.textMuted }]}>
                  {createdAt ? new Date(createdAt).toLocaleDateString('es-CO') : '—'}
                </Text>
              </View>
              {!isMe && (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, name)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {showCreate && (
        <CreateAdminModal
          colors={colors}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAdmins(); }}
        />
      )}
    </View>
  );
}

function CreateAdminModal({ colors, onClose, onCreated }: {
  colors: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { request, loading } = useApi();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    const result = await request('/admin/admins', {
      method: 'POST',
      body: {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        role: 'admin',
      },
    });
    if (result) onCreated();
    else Alert.alert('Error', 'No se pudo crear. El usuario puede estar en uso.');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo administrador</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.warnBanner, {
            backgroundColor: `${colors.warning}10`,
            borderColor: `${colors.warning}30`,
          }]}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={[styles.warnText, { color: colors.warning }]}>
              Solo crea cuentas para personas de confianza.
            </Text>
          </View>

          <Input label="Nombre completo" value={fullName} onChangeText={setFullName}
            error={errors.fullName}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />

          <Input label="Usuario" placeholder="usuario_admin" value={username}
            onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, '_'))}
            autoCapitalize="none" error={errors.username}
            leftIcon={<Ionicons name="at-outline" size={18} color={colors.textMuted} />} />

          <Input label="Contraseña" value={password} onChangeText={setPassword}
            secureTextEntry={!showPw} error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            } />

          <Input label="Confirmar contraseña" value={confirmPassword}
            onChangeText={setConfirmPassword} secureTextEntry={!showPw}
            error={errors.confirm}
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />} />

          <Button label="Crear administrador" onPress={handleCreate} loading={loading} />
          <Button label="Cancelar" onPress={onClose} variant="ghost" />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyText: { fontSize: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  rowInfo: { flex: 1 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowUsername: { fontSize: 12, marginTop: 2 },
  rowDate: { fontSize: 11, marginTop: 3 },
  deleteBtn: { padding: 8 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  warnBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 20,
  },
  warnText: { flex: 1, fontSize: 13, lineHeight: 19 },
});