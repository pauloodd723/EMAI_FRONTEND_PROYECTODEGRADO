import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, ScrollView,
  Alert, RefreshControl, StyleSheet, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, Badge, AppFooter } from '@/src/components/ui';

export default function TokensScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqCreate, loading: creating } = useApi<any>();

  const [tokens, setTokens] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<any>(null);
  const [filter, setFilter] = useState<'todos' | 'disponibles' | 'usados'>('todos');

  const fetchTokens = useCallback(async () => {
    const data = await request('/admin/tokens');
    if (data) setTokens(data);
  }, [request]);

  useEffect(() => { fetchTokens(); }, []);
  useAutoRefresh(fetchTokens);

  const handleGenerate = async (institutionName: string) => {
    const result = await reqCreate('/admin/tokens', {
      method: 'POST',
      body: { institutionName: institutionName.trim() || undefined },
    });
    if (result) { setShowCreate(false); setNewToken(result); fetchTokens(); }
    else Alert.alert('Error', 'No se pudo generar el token.');
  };

  const filtered = tokens.filter((t) => {
    if (filter === 'disponibles') return !t.used;
    if (filter === 'usados') return t.used;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Tokens de acceso" showBack />
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchTokens(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <Button label="+ Generar nuevo token" onPress={() => setShowCreate(true)} style={{ marginBottom: 12 }} />
            <View style={styles.filters}>
              {(['todos', 'disponibles', 'usados'] as const).map((f) => (
                <TouchableOpacity key={f}
                  style={[styles.filterBtn, { borderColor: colors.border }, filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setFilter(f)}>
                  <Text style={[styles.filterText, { color: filter === f ? '#FFF' : colors.textSecondary }]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.count, { color: colors.textMuted }]}>{filtered.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="key-outline" size={44} color={colors.textMuted} />
            <Text style={[{ color: colors.textMuted, fontSize: 14 }]}>No hay tokens aún.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: item.used ? 0.6 : 1 }]}>
            <View style={[styles.tokenIcon, { backgroundColor: item.used ? colors.borderLight : `${colors.primary}15` }]}>
              <Ionicons name={item.used ? 'checkmark-done-outline' : 'key-outline'} size={20} color={item.used ? colors.textMuted : colors.primary} />
            </View>
            <View style={styles.tokenInfo}>
              <Text style={[styles.tokenCode, { color: colors.textPrimary }]}>{item.token}</Text>
              {(item.institutionName ?? item.institution_name) && (
                <Text style={[styles.tokenInst, { color: colors.textSecondary }]}>{item.institutionName ?? item.institution_name}</Text>
              )}
              <Text style={[styles.tokenDate, { color: colors.textMuted }]}>
                {item.createdAt ?? item.created_at ? new Date(item.createdAt ?? item.created_at).toLocaleDateString('es-CO') : '—'}
              </Text>
            </View>
            <View style={styles.tokenRight}>
              <Badge label={item.used ? 'Usado' : 'Disponible'} variant={item.used ? 'default' : 'success'} />
              {!item.used && (
                <TouchableOpacity style={[styles.copyBtn, { backgroundColor: `${colors.primary}12` }]}
                  onPress={() => { Clipboard.setString(item.token); Alert.alert('✓ Copiado', `Token "${item.token}" copiado.`); }}>
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {showCreate && (
        <CreateTokenModal colors={colors} loading={creating} onClose={() => setShowCreate(false)} onGenerate={handleGenerate} />
      )}

      {newToken && (
        <NewTokenModal token={newToken} colors={colors} onClose={() => setNewToken(null)} />
      )}
    </View>
  );
}

function CreateTokenModal({ colors, loading, onClose, onGenerate }: any) {
  const [institutionName, setInstitutionName] = useState('');
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo token</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}0D` }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>El token se entregará al directivo principal para crear su cuenta.</Text>
          </View>
          <Input label="Nombre de la institución (opcional)" placeholder="Ej: I.E. Colegio Nacional"
            value={institutionName} onChangeText={setInstitutionName}
            leftIcon={<Ionicons name="business-outline" size={18} color={colors.textMuted} />} />
          <Button label="Generar token" onPress={() => onGenerate(institutionName)} loading={loading} />
          <Button label="Cancelar" onPress={onClose} variant="ghost" />
        </ScrollView>
      </View>
    </Modal>
  );
}

function NewTokenModal({ token, colors, onClose }: any) {
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.newTokenCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.newTokenIcon, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={44} color={colors.success} />
          </View>
          <Text style={[styles.newTokenTitle, { color: colors.textPrimary }]}>¡Token generado!</Text>
          {(token.institutionName ?? token.institution_name) && (
            <Text style={[styles.newTokenInst, { color: colors.textSecondary }]}>{token.institutionName ?? token.institution_name}</Text>
          )}
          <TouchableOpacity
            style={[styles.tokenDisplay, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}
            onPress={() => { Clipboard.setString(token.token); Alert.alert('✓ Copiado'); }}
          >
            <Text style={[styles.tokenDisplayText, { color: colors.primary }]}>{token.token}</Text>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.newTokenHint, { color: colors.textMuted }]}>Toca el token para copiarlo.</Text>
          <Button label="Entendido" onPress={onClose} style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  tokenIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tokenInfo: { flex: 1 },
  tokenCode: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  tokenInst: { fontSize: 13, marginTop: 2 },
  tokenDate: { fontSize: 11, marginTop: 3 },
  tokenRight: { gap: 8, alignItems: 'flex-end' },
  copyBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  newTokenCard: { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center', gap: 12 },
  newTokenIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  newTokenTitle: { fontSize: 22, fontWeight: '800' },
  newTokenInst: { fontSize: 14 },
  tokenDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, borderWidth: 1, width: '100%', justifyContent: 'center' },
  tokenDisplayText: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  newTokenHint: { fontSize: 13, textAlign: 'center' },
});
