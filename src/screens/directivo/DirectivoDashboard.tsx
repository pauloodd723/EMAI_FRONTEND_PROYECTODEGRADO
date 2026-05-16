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

interface DirectivoStats {
  totalDirectivos: number;
  totalDocentes: number;
  totalCursos: number;
  totalEstudiantes: number;
}

export default function DirectivoDashboard() {
  const router = useRouter();
  const { user, institution } = useAuth();
  const { colors } = useTheme();
  const { request } = useApi<any>();

  const [stats, setStats] = useState<DirectivoStats>({
    totalDirectivos: 0,
    totalDocentes: 0,
    totalCursos: 0,
    totalEstudiantes: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const data = await request('/directivo/stats');
    if (data) setStats({
      totalDirectivos:  data.totalDirectivos  ?? data.total_directivos  ?? 0,
      totalDocentes:    data.totalDocentes    ?? data.total_docentes    ?? 0,
      totalCursos:      data.totalCursos      ?? data.total_cursos      ?? 0,
      totalEstudiantes: data.totalEstudiantes ?? data.total_estudiantes ?? 0,
    });
  }, [request]);

  useEffect(() => { fetchStats(); }, []);
  useAutoRefresh(fetchStats);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const isPrincipal = !user?.subRole || user?.subRole === 'director';

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
        {/* SALUDO */}
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: colors.textSecondary }]}>Bienvenido,</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {user?.fullName ?? user?.username ?? ''}
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatChip label="Directivos"  value={stats.totalDirectivos}  color={colors.primary} />
          <StatChip label="Docentes"    value={stats.totalDocentes}    color={colors.secondary} />
          <StatChip label="Cursos"      value={stats.totalCursos}      color={colors.accent} />
          <StatChip label="Estudiantes" value={stats.totalEstudiantes} color={colors.success} />
        </View>

        {/* ── INSTITUCIÓN ───────────────────────────────────────── */}
        <SectionLabel label="Institución" colors={colors} />

        <DashboardCard
          icon="business-outline"
          title="Configurar institución"
          description="Nombre, colores y logo"
          onPress={() => router.push('/(directivo)/institucion')}
        />

        <DashboardCard
          icon="shield-checkmark-outline"
          title="Términos de datos"
          description={institution?.dataTermsAccepted ? 'Términos aceptados ✓' : 'Debes aceptar los términos'}
          onPress={() => router.push('/(directivo)/terminos')}
          accentColor={institution?.dataTermsAccepted ? colors.success : colors.warning}
        />

        {/* ── USUARIOS ──────────────────────────────────────────── */}
        <SectionLabel label="Usuarios" colors={colors} />

        {isPrincipal && (
          <DashboardCard
            icon="people-circle-outline"
            title="Crear directivos"
            description="Agrega directivos y asigna roles internos"
            badge={stats.totalDirectivos}
            onPress={() => router.push('/(directivo)/usuarios/directivos')}
          />
        )}

        <DashboardCard
          icon="school-outline"
          title="Crear docentes"
          description="Crea cuentas y asigna cursos"
          badge={stats.totalDocentes}
          onPress={() => router.push('/(directivo)/usuarios/docentes')}
        />

        <DashboardCard
          icon="list-outline"
          title="Lista de usuarios"
          description="Ver y editar todos los directivos y docentes"
          onPress={() => router.push('/(directivo)/usuarios/lista')}
        />

        {/* ── ACADÉMICO ─────────────────────────────────────────── */}
        <SectionLabel label="Académico" colors={colors} />

        <DashboardCard
          icon="albums-outline"
          title="Cursos"
          description="Crear y gestionar cursos del año escolar"
          badge={stats.totalCursos}
          onPress={() => router.push('/(directivo)/cursos')}
        />

        <DashboardCard
          icon="book-outline"
          title="Materias"
          description="Matemáticas y otras materias"
          onPress={() => router.push('/(directivo)/materias')}
        />

        {/* ── SUPERVISIÓN ───────────────────────────────────────── */}
        <SectionLabel label="Supervisión" colors={colors} />

        <DashboardCard
          icon="eye-outline"
          title="Cursos y estudiantes"
          description="Vista supervisión de todos los cursos"
          badge={stats.totalEstudiantes}
          onPress={() => router.push('/(directivo)/supervision')}
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
