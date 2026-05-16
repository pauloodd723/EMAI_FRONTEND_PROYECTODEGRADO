import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Avatar, AppFooter } from '@/src/components/ui';

export default function SupervisionScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const [students, setStudents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = useCallback(async () => {
    const data = await request('/directivo/supervision/estudiantes');
    if (data) setStudents(data);
  }, [request]);

  useEffect(() => { fetchStudents(); }, []);
  useAutoRefresh(fetchStudents);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Supervisión" showBack />
      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchStudents();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {students.length} estudiante(s)
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={colors.textMuted} />
            <Text style={[{ color: colors.textMuted, fontSize: 14 }]}>No hay estudiantes aún.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Avatar name={item.fullName ?? item.full_name ?? '?'} photoUrl={item.photoUrl ?? item.photo_url} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, { color: colors.textPrimary }]}>
                {item.fullName ?? item.full_name ?? '?'}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                Curso: {item.courseId ?? item.course_id ?? '—'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  count: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
});