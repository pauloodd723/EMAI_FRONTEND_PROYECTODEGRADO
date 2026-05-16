import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { DashboardCard } from '@/src/components/DashboardCard';
import { AppFooter } from '@/src/components/ui';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { request } = useApi<any>();

  const [stats, setStats] = useState({
    totalTokens: 0, tokensUsados: 0,
    totalInstituciones: 0, totalAdmins: 0, mensajesSinLeer: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const data = await request('/admin/stats');
    if (data) setStats({
      totalTokens:        data.totalTokens        ?? data.total_tokens        ?? 0,
      tokensUsados:       data.tokensUsados        ?? data.tokens_usados       ?? 0,
      totalInstituciones: data.totalInstituciones  ?? data.total_instituciones ?? 0,
      totalAdmins:        data.totalAdmins         ?? data.total_admins        ?? 0,
      mensajesSinLeer:    data.mensajesSinLeer      ?? data.mensajes_sin_leer  ?? 0,
    });
  }, [request]);

  useEffect(() => { fetchStats(); }, []);
  useAutoRefresh(fetchStats);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: colors.textSecondary }]}>Panel de administración</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.fullName ?? user?.username ?? ''}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatChip label="Tokens"        value={stats.totalTokens}        color={colors.primary} />
          <StatChip label="Usados"        value={stats.tokensUsados}       color={colors.secondary} />
          <StatChip label="Instituciones" value={stats.totalInstituciones} color={colors.accent} />
          <StatChip label="Sin leer"      value={stats.mensajesSinLeer}    color={stats.mensajesSinLeer > 0 ? colors.error : colors.success} />
        </View>

        <SectionLabel label="Tokens de acceso" colors={colors} />
        <DashboardCard icon="key-outline" title="Generar tokens" description="Crear tokens para nuevas instituciones"
          badge={stats.totalTokens} onPress={() => router.push('/(admin)/tokens')} accentColor={colors.primary} />

        <SectionLabel label="Administradores" colors={colors} />
        <DashboardCard icon="shield-outline" title="Administradores del sistema" description="Crear y gestionar cuentas de admin"
          badge={stats.totalAdmins} onPress={() => router.push('/(admin)/admins')} accentColor={colors.secondary} />

        <SectionLabel label="Soporte" colors={colors} />
        <DashboardCard icon="chatbubbles-outline" title="Mensajes de soporte" description="Bandeja de mensajes"
          badge={stats.mensajesSinLeer > 0 ? stats.mensajesSinLeer : undefined}
          onPress={() => router.push('/(admin)/soporte')}
          accentColor={stats.mensajesSinLeer > 0 ? colors.error : colors.accent} />

        <View style={[styles.privacyNote, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            Por protección de datos, el administrador no tiene acceso a información académica de estudiantes ni exámenes.
          </Text>
        </View>

        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>;
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: `${color}12` }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  greeting: { paddingTop: 24, paddingBottom: 8, paddingHorizontal: 4 },
  hello: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  chipValue: { fontSize: 18, fontWeight: '800' },
  chipLabel: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 8, marginBottom: 2, paddingHorizontal: 4 },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  privacyIcon: { fontSize: 16 },
  privacyText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
