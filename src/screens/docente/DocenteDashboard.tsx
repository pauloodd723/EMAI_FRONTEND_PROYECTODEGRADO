import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { DashboardCard } from '@/src/components/DashboardCard';
import { AppFooter } from '@/src/components/ui';

interface DocenteStats {
  totalEstudiantes: number;
  totalExamenes: number;
  examenesHoy: number;
  promedioGeneral: number | null;
}

export default function DocenteDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { request } = useApi<any>();

  const [stats, setStats] = useState<DocenteStats>({
    totalEstudiantes: 0,
    totalExamenes: 0,
    examenesHoy: 0,
    promedioGeneral: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const data = await request('/docente/stats');
    if (data) {
      setStats({
        totalEstudiantes: data.total_estudiantes ?? data.totalEstudiantes ?? 0,
        totalExamenes: data.total_examenes ?? data.totalExamenes ?? 0,
        examenesHoy: data.examenes_hoy ?? data.examenesHoy ?? 0,
        promedioGeneral: data.promedio_general ?? data.promedioGeneral ?? null,
      });
    }
  }, [request]);

  useEffect(() => { fetchStats(); }, []);
  useAutoRefresh(fetchStats);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const promedio = stats.promedioGeneral;
  const promedioStr = promedio !== null && promedio !== undefined
    ? Number(promedio).toFixed(1)
    : '—';
  const promedioColor = promedio !== null && promedio !== undefined && promedio >= 3
    ? colors.success
    : colors.warning;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: colors.textSecondary }]}>Bienvenido,</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {user?.fullName ?? user?.username ?? ''}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatChip label="Estudiantes" value={stats.totalEstudiantes} color={colors.primary} />
          <StatChip label="Exámenes"    value={stats.totalExamenes}    color={colors.secondary} />
          <StatChip label="Hoy"         value={stats.examenesHoy}      color={colors.accent} />
          <StatChip label="Promedio"    value={promedioStr}             color={promedioColor} />
        </View>

        <SectionLabel label="Académico" colors={colors} />

        <DashboardCard
          icon="people-outline"
          title="Cursos y Estudiantes"
          description="Ver cursos, listas y crear estudiantes"
          badge={stats.totalEstudiantes}
          onPress={() => router.push('/(docente)/cursos')}
        />

        <DashboardCard
          icon="document-text-outline"
          title="Crear Examen"
          description="Nuevo examen rápido para un curso"
          onPress={() => router.push('/(docente)/crear-examen')}
          accentColor={colors.secondary}
        />

        <SectionLabel label="Calificación" colors={colors} />

        <DashboardCard
          icon="scan-outline"
          title="Escanear Examen"
          description="Tomar foto y calificar automáticamente"
          onPress={() => router.push('/(docente)/escanear')}
          accentColor={colors.accent}
        />

        <SectionLabel label="Análisis" colors={colors} />

        <DashboardCard
          icon="bar-chart-outline"
          title="Reportes"
          description="Estadísticas, gráficas y tendencias"
          onPress={() => router.push('/(docente)/reportes')}
          accentColor={colors.success}
        />

        <View style={{ marginTop: 32 }}>
          <AppFooter />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {label.toUpperCase()}
    </Text>
  );
}

function StatChip({ label, value, color }: { label: string; value: number | string; color: string }) {
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
  hello: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  chipValue: { fontSize: 18, fontWeight: '800' },
  chipLabel: { fontSize: 10, fontWeight: '600', opacity: 0.8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginTop: 8, marginBottom: 2, paddingHorizontal: 4,
  },
});
