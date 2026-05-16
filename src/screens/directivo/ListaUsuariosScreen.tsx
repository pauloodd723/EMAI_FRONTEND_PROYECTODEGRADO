import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User, UserRole } from '../../types';
import { DIRECTIVO_SUB_ROLES } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { TopBar } from '../../components/TopBar';
import { Avatar, Button, Input, Badge, AppFooter } from '../../components/ui';

type FilterRole = 'todos' | 'directivo' | 'docente';

export default function ListaUsuariosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { request, loading } = useApi<User[]>();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterRole>('todos');
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    const data = await request('/directivo/usuarios');
    if (data) setUsers(data);
  }, [request]);

  useEffect(() => { fetchUsers(); }, []);
  useAutoRefresh(fetchUsers);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filtered = users.filter((u) => {
    const matchRole = filter === 'todos' || u.role === filter;
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Lista de usuarios" showBack />

      {/* BÚSQUEDA */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar por nombre o usuario..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* FILTROS */}
      <View style={styles.filters}>
        {(['todos', 'directivo', 'docente'] as FilterRole[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              { borderColor: colors.border },
              filter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#FFF' : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.count, { color: colors.textMuted }]}>{filtered.length} usuario(s)</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay usuarios</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <UserRow user={item} colors={colors} onEdit={() => setEditingUser(item)} />
        )}
      />

      {/* MODAL EDITAR */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          colors={colors}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); fetchUsers(); }}
        />
      )}
    </View>
  );
}

// ─── FILA DE USUARIO ─────────────────────────────────────────────────────────
function UserRow({ user, colors, onEdit }: { user: User; colors: any; onEdit: () => void }) {
  const roleBadge = user.role === 'docente'
    ? <Badge label="Docente" variant="info" />
    : <Badge label={user.subRole ?? 'Directivo'} variant="default" />;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Avatar name={user.fullName} photoUrl={user.photoUrl} size={46} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.textPrimary }]}>{user.fullName}</Text>
        <Text style={[styles.rowUsername, { color: colors.textSecondary }]}>@{user.username}</Text>
        {user.courseId && (
          <Text style={[styles.rowCourse, { color: colors.textMuted }]}>
            <Ionicons name="albums-outline" size={11} /> Curso: {user.courseId}
          </Text>
        )}
      </View>
      <View style={styles.rowRight}>
        {roleBadge}
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: `${colors.primary}12` }]}
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MODAL EDITAR USUARIO ────────────────────────────────────────────────────
function EditUserModal({ user, colors, onClose, onSaved }: {
  user: User; colors: any; onClose: () => void; onSaved: () => void;
}) {
  const { request, loading } = useApi();
  const [fullName, setFullName] = useState(user.fullName);
  const [password, setPassword] = useState('');
  const [subRole, setSubRole] = useState(user.subRole ?? '');
  const [errors, setErrors] = useState<{ fullName?: string }>({});

  const handleSave = async () => {
    if (!fullName.trim()) { setErrors({ fullName: 'Requerido' }); return; }
    const body: Record<string, string> = { fullName: fullName.trim() };
    if (password) body.password = password;
    if (user.role === 'directivo' && subRole) body.subRole = subRole;

    const result = await request(`/directivo/usuarios/${user.id}`, { method: 'PATCH', body });
    if (result) onSaved();
    else Alert.alert('Error', 'No se pudo guardar');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Editar usuario</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 0 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Avatar name={user.fullName} photoUrl={user.photoUrl} size={64} />
            <Text style={[{ marginTop: 8, fontSize: 13, color: colors.textMuted }]}>@{user.username}</Text>
          </View>

          <Input label="Nombre completo" value={fullName} onChangeText={setFullName} error={errors.fullName} />
          <Input
            label="Nueva contraseña (opcional)"
            placeholder="Dejar vacío para no cambiar"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {user.role === 'directivo' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Rol interno</Text>
              <View style={styles.rolesGrid}>
                {DIRECTIVO_SUB_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleChip,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      subRole === r.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSubRole(r.value)}
                  >
                    <Text style={[styles.roleChipText, { color: subRole === r.value ? '#FFF' : colors.textSecondary }]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Button label="Guardar cambios" onPress={handleSave} loading={loading} />
          <Button label="Cancelar" onPress={onClose} variant="ghost" />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowUsername: { fontSize: 12, marginTop: 2 },
  rowCourse: { fontSize: 11, marginTop: 3 },
  rowRight: { gap: 8, alignItems: 'flex-end' },
  editBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10, letterSpacing: 0.3 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  roleChipText: { fontSize: 13, fontWeight: '600' },
});
