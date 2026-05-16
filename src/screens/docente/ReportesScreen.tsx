import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Dimensions,
  RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { AppFooter } from '@/src/components/ui';
import { PASSING_GRADE } from '@/src/constants';

const CHART_H = 160;

export default function ReportesScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any>();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const d = await request('/docente/reportes');
    if (d) setData(d);
  }, [request]);

  useEffect(() => { fetchData(); }, []);
  useAutoRefresh(fetchData);

  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar title="Reportes" showBack />
        <View style={styles.loading}>
          <Text style={[{ color: colors.textMuted, fontSize: 15 }]}>Cargando reportes...</Text>
        </View>
      </View>
    );
  }

  const totalExamenes = data.total_examenes ?? data.totalExamenes ?? 0;
  const totalEstudiantes = data.total_estudiantes ?? data.totalEstudiantes ?? 0;
  const aprobados = data.aprobados ?? 0;
  const reprobados = data.reprobados ?? 0;
  const promedio = data.promedio_general ?? data.promedioGeneral ?? 0;
  const distribucion = data.distribucion ?? [];
  const porCurso = data.promedios_por_curso ?? data.promediosPorCurso ?? [];
  const passRate = totalExamenes > 0 ? Math.round((aprobados / totalExamenes) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Reportes" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RESUMEN GENERAL</Text>
        <View style={styles.metricsGrid}>
          <MetricCard label="Total exámenes"   value={totalExamenes}          icon="document-text-outline" color={colors.primary} />
          <MetricCard label="Estudiantes"       value={totalEstudiantes}       icon="people-outline"        color={colors.secondary} />
          <MetricCard label="Promedio general"  value={Number(promedio).toFixed(1)} icon="star-outline"     color={Number(promedio) >= PASSING_GRADE ? colors.success : colors.error} />
          <MetricCard label="Tasa aprobación"   value={`${passRate}%`}         icon="trending-up-outline"   color={passRate >= 60 ? colors.success : colors.warning} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APROBADOS VS REPROBADOS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.passFailRow}>
            <View style={styles.passFailItem}>
              <View style={[styles.passFailDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.passFailLabel, { color: colors.textSecondary }]}>Aprobados</Text>
              <Text style={[styles.passFailValue, { color: colors.success }]}>{aprobados}</Text>
            </View>
            <View style={styles.passFailItem}>
              <View style={[styles.passFailDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.passFailLabel, { color: colors.textSecondary }]}>Reprobados</Text>
              <Text style={[styles.passFailValue, { color: colors.error }]}>{reprobados}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${passRate}%` as any }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: colors.success }]}>{passRate}% aprobados</Text>
            <Text style={[styles.progressLabel, { color: colors.error }]}>{100 - passRate}% reprobados</Text>
          </View>
        </View>

        {distribucion.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DISTRIBUCIÓN DE NOTAS</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={styles.chart}>
                {distribucion.map((item: any, i: number) => {
                  const maxVal = Math.max(...distribucion.map((d: any) => d.cantidad ?? 0), 1);
                  const ratio = (item.cantidad ?? 0) / maxVal;
                  const rango = item.rango ?? '';
                  const isGreen = parseFloat(rango.split('-')[0]) >= PASSING_GRADE;
                  return (
                    <View key={i} style={styles.barGroup}>
                      <Text style={[styles.barValue, { color: colors.textSecondary }]}>{item.cantidad ?? 0}</Text>
                      <View style={[styles.barTrack, { backgroundColor: colors.borderLight }]}>
                        <View style={[styles.barFill, { height: `${Math.max(5, ratio * 100)}%` as any, backgroundColor: isGreen ? colors.success : colors.error }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{rango}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {porCurso.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PROMEDIO POR CURSO</Text>
            {porCurso.map((c: any) => {
              const prom = c.promedio ?? 0;
              const passed = prom >= PASSING_GRADE;
              return (
                <View key={c.courseId ?? c.course_id ?? c.courseName} style={[styles.courseRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <View style={[styles.courseChip, { backgroundColor: `${colors.primary}12` }]}>
                    <Text style={[styles.courseChipText, { color: colors.primary }]}>{c.courseName ?? c.course_name ?? '?'}</Text>
                  </View>
                  <View style={styles.courseRowInfo}>
                    <Text style={[styles.courseRowName, { color: colors.textPrimary }]}>{c.courseName ?? c.course_name}</Text>
                    <Text style={[styles.courseRowCount, { color: colors.textSecondary }]}>{c.count ?? 0} exámenes</Text>
                  </View>
                  <Text style={[styles.courseRowScore, { color: passed ? colors.success : colors.error }]}>
                    {Number(prom).toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[styles.metric, { backgroundColor: `${color}0E` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  metric: { width: '47.5%', borderRadius: 14, padding: 16, gap: 6 },
  metricValue: { fontSize: 24, fontWeight: '900' },
  metricLabel: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  passFailRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  passFailItem: { alignItems: 'center', gap: 6 },
  passFailDot: { width: 12, height: 12, borderRadius: 6 },
  passFailLabel: { fontSize: 13 },
  passFailValue: { fontSize: 24, fontWeight: '900' },
  progressTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 8 },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barValue: { fontSize: 11 },
  barTrack: { width: '100%', flex: 1, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  courseRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12, marginBottom: 8 },
  courseChip: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  courseChipText: { fontSize: 11, fontWeight: '900' },
  courseRowInfo: { flex: 1 },
  courseRowName: { fontSize: 15, fontWeight: '700' },
  courseRowCount: { fontSize: 12, marginTop: 2 },
  courseRowScore: { fontSize: 22, fontWeight: '900' },
});
