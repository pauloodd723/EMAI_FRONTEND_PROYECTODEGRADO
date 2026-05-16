import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Badge, Avatar, AppFooter } from '@/src/components/ui';

function safeDate(val: any): string {
  if (!val) return 'Sin fecha';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleDateString('es-CO');
  } catch {
    return 'Sin fecha';
  }
}

function safeDatetime(val: any): string {
  if (!val) return 'Sin fecha';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleString('es-CO');
  } catch {
    return 'Sin fecha';
  }
}

export default function SoporteAdminScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqMark } = useApi();

  const [messages, setMessages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter] = useState<'todos' | 'sinLeer' | 'leidos'>('todos');

  const fetchMessages = useCallback(async () => {
    const data = await request('/admin/soporte');
    if (data) setMessages(data);
  }, [request]);

  useEffect(() => { fetchMessages(); }, []);
  useAutoRefresh(fetchMessages);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const openMessage = async (msg: any) => {
    setSelected(msg);
    if (!msg.read) {
      await reqMark(`/admin/soporte/${msg.id}/leer`, { method: 'PATCH' });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  const filtered = messages.filter((m) => {
    if (filter === 'sinLeer') return !m.read;
    if (filter === 'leidos') return m.read;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Soporte" showBack />

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            {unreadCount > 0 && (
              <View style={[styles.unreadBanner, { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}25` }]}>
                <Ionicons name="mail-unread-outline" size={16} color={colors.error} />
                <Text style={[styles.unreadText, { color: colors.error }]}>
                  {unreadCount} mensaje{unreadCount > 1 ? 's' : ''} sin leer
                </Text>
              </View>
            )}
            <View style={styles.filters}>
              {(['todos', 'sinLeer', 'leidos'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, { borderColor: colors.border }, filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, { color: filter === f ? '#FFF' : colors.textSecondary }]}>
                    {f === 'todos' ? 'Todos' : f === 'sinLeer' ? 'Sin leer' : 'Leídos'}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.count, { color: colors.textMuted }]}>{filtered.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay mensajes.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <MessageRow msg={item} colors={colors} onPress={() => openMessage(item)} />
        )}
      />

      {selected && (
        <MessageDetailModal msg={selected} colors={colors} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function MessageRow({ msg, colors, onPress }: { msg: any; colors: any; onPress: () => void }) {
  const name = msg.fromUsername ?? msg.from_username ?? '?';
  const role = msg.fromRole ?? msg.from_role ?? '';
  const date = safeDate(msg.createdAt ?? msg.created_at);
  const message = msg.message ?? '';
  const isRead = msg.read ?? false;

  const roleLabel: Record<string, string> = { docente: 'Docente', directivo: 'Directivo', admin: 'Admin' };

  return (
    <TouchableOpacity
      style={[
        styles.msgRow,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        !isRead && { borderLeftWidth: 3, borderLeftColor: colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Avatar name={name} size={44} />
      <View style={styles.msgInfo}>
        <View style={styles.msgTopRow}>
          <Text style={[styles.msgFrom, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.msgDate, { color: colors.textMuted }]}>{date}</Text>
        </View>
        <Text style={[styles.msgPreview, { color: colors.textSecondary }]} numberOfLines={2}>
          {message}
        </Text>
        <View style={styles.msgTags}>
          <Badge label={roleLabel[role] ?? role} variant="default" />
          {!isRead && <Badge label="Nuevo" variant="info" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MessageDetailModal({ msg, colors, onClose }: { msg: any; colors: any; onClose: () => void }) {
  const name = msg.fromUsername ?? msg.from_username ?? '?';
  const role = msg.fromRole ?? msg.from_role ?? '';
  const datetime = safeDatetime(msg.createdAt ?? msg.created_at);
  const message = msg.message ?? '';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Mensaje de soporte</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.senderCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Avatar name={name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.senderName, { color: colors.textPrimary }]}>{name}</Text>
              <Text style={[styles.senderRole, { color: colors.textSecondary }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={[styles.senderDate, { color: colors.textMuted }]}>{datetime}</Text>
            </View>
          </View>

          <View style={[styles.msgBody, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.msgBodyText, { color: colors.textPrimary }]}>{message}</Text>
          </View>

          <View style={[styles.replyNote, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}25` }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
            <Text style={[styles.replyNoteText, { color: colors.warning }]}>
              Para responder, contacta directamente al usuario por los medios de la institución.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  unreadBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  unreadText: { fontSize: 14, fontWeight: '600' },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyText: { fontSize: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  msgInfo: { flex: 1, gap: 4 },
  msgTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msgFrom: { fontSize: 14, fontWeight: '700' },
  msgDate: { fontSize: 11 },
  msgPreview: { fontSize: 13, lineHeight: 19 },
  msgTags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  senderCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  senderName: { fontSize: 16, fontWeight: '700' },
  senderRole: { fontSize: 13, marginTop: 2 },
  senderDate: { fontSize: 11, marginTop: 4 },
  msgBody: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  msgBodyText: { fontSize: 15, lineHeight: 23 },
  replyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  replyNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
