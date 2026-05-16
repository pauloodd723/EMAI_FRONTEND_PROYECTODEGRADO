import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, Badge, AppFooter } from '@/src/components/ui';
import { PASSING_GRADE } from '@/src/constants';

// ─── PLAN PEDAGÓGICO BONITO ───────────────────────────────────────────────────
function TeachingPlanCard({ plan, colors }: { plan: string; colors: any }) {
  if (!plan || plan.includes('¡Excelente')) {
    return (
      <View style={[styles.planSuccess, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}25` }]}>
        <Text style={styles.planSuccessIcon}>🌟</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planSuccessTitle, { color: colors.success }]}>¡Excelente trabajo!</Text>
          <Text style={[styles.planSuccessText, { color: colors.success }]}>
            El estudiante domina todos los temas evaluados.
          </Text>
        </View>
      </View>
    );
  }

  const blocks = plan.split('\n\n').filter(Boolean);
  return (
    <View style={styles.planContainer}>
      {blocks.map((block, idx) => {
        const lines = block.split('\n').filter(Boolean);
        if (!lines.length) return null;
        const titleLine = lines[0];
        const tipLines = lines.slice(1);
        const emojiMatch = titleLine.match(/^([\u{1F000}-\u{1FFFF}]|[\u2600-\u27FF]|📏|📖|🔢|🐊|🧱|⚡)/u);
        const emoji = emojiMatch ? emojiMatch[0] : '📌';
        const withoutEmoji = titleLine.replace(emoji, '').trim();
        const nameMatch = withoutEmoji.match(/\*\*(.+?)\*\*/);
        const topicName = nameMatch ? nameMatch[1] : withoutEmoji.split('(')[0].trim();
        const exampleMatch = withoutEmoji.match(/\(ej:\s*(.+?)\)/);
        const example = exampleMatch ? exampleMatch[1] : '';
        const topicColors: Record<string, string> = {
          '🔢': colors.primary, '🧱': '#7C3AED', '🐊': '#DC2626',
          '⚡': '#D97706', '📏': '#059669', '📖': '#2563EB',
        };
        const accentColor = topicColors[emoji] || colors.primary;
        return (
          <View key={idx} style={[styles.planBlock, { borderLeftColor: accentColor, backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.planBlockHeader}>
              <View style={[styles.planEmoji, { backgroundColor: `${accentColor}15` }]}>
                <Text style={styles.planEmojiText}>{emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTopicName, { color: accentColor }]}>{topicName}</Text>
                {example && (
                  <View style={[styles.planExamplePill, { backgroundColor: `${accentColor}12` }]}>
                    <Text style={[styles.planExampleText, { color: accentColor }]}>Ej: {example}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.planTips}>
              {tipLines.map((tip, tidx) => {
                const tipEmoji = tip.match(/^(🔢|🧮|🎯|📏|📖|🐊|🧱|⚡)/u)?.[0] || '•';
                const tipText = tip.replace(tipEmoji, '').trim();
                const tipColors: Record<string, string> = {
                  '🔢': colors.primary, '🧮': '#7C3AED', '🎯': '#DC2626',
                  '📏': '#059669', '📖': '#2563EB',
                };
                const tipColor = tipColors[tipEmoji] || colors.textSecondary;
                return (
                  <View key={tidx} style={styles.planTipRow}>
                    <View style={[styles.planTipDot, { backgroundColor: tipColor }]}>
                      <Text style={styles.planTipDotText}>{tipEmoji}</Text>
                    </View>
                    <Text style={[styles.planTipText, { color: colors.textSecondary }]}>{tipText}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function RevisionExamenScreen() {
  const { resultId } = useLocalSearchParams<{ resultId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { request } = useApi<any>();
  const { request: reqSave, loading: saving } = useApi();

  const [result, setResult] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [showPlan, setShowPlan] = useState(true);
  const [showProblems, setShowProblems] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResult = useCallback(async () => {
    const data = await request(`/docente/examenes/resultados/${resultId}`);
    if (data) {
      setResult(data);
      setProblems(data.problems ?? []);
      setTeacherNotes(data.teacherNotes ?? '');

      // Si ya terminó de procesar, detener el polling
      if (data.status !== 'processing') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
    return data;
  }, [resultId]);

  useEffect(() => {
    fetchResult().then((data) => {
      // Si está procesando, iniciar auto-refresh cada 3 segundos
      if (data?.status === 'processing') {
        pollingRef.current = setInterval(async () => {
          const updated = await request(`/docente/examenes/resultados/${resultId}`);
          if (updated) {
            setResult(updated);
            setProblems(updated.problems ?? []);
            setTeacherNotes(updated.teacherNotes ?? '');
            if (updated.status !== 'processing') {
              clearInterval(pollingRef.current!);
              pollingRef.current = null;
            }
          }
        }, 3000);
      }
    });
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const toggleProblem = (problemId: string) => {
    setProblems((prev) =>
      prev.map((p) => p.id === problemId ? { ...p, isCorrect: !p.isCorrect, teacherOverride: true } : p)
    );
  };

  const correctCount = problems.filter((p) => p.isCorrect === true).length;
  const definitiveCount = problems.filter((p) => p.isCorrect !== null && p.isCorrect !== undefined).length;
  const calculatedScore = definitiveCount > 0
    ? Math.max(1.0, Math.min(5.0, 1.0 + (correctCount / definitiveCount) * 4.0))
    : result?.finalScore ?? null;
  const passed = calculatedScore !== null && calculatedScore >= PASSING_GRADE;

  const handleSave = async () => {
    const saved = await reqSave(`/docente/examenes/resultados/${resultId}`, {
      method: 'PATCH',
      body: { problems, teacherNotes: teacherNotes.trim(), finalScore: calculatedScore },
    });
    if (saved) {
      Alert.alert('✓ Guardado', 'La calificación fue guardada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo guardar.');
    }
  };

  // Pantalla de carga mientras procesa — sin mensaje de "jala hacia abajo"
  if (!result || result.status === 'processing') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar title="Procesando examen" showBack />
        <View style={styles.processingScreen}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>
            Analizando examen...
          </Text>
          <Text style={[styles.processingSubtitle, { color: colors.textSecondary }]}>
            Esto puede tardar unos segundos.{'\n'}La pantalla se actualizará automáticamente.
          </Text>
        </View>
      </View>
    );
  }

  const teachingPlan: string = result.teachingPlan ?? '';
  const examName: string = result.examName ?? 'Examen';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title={examName} showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchResult(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* NOTA PRINCIPAL */}
        <View style={[
          styles.scoreCard,
          { backgroundColor: passed ? '#E8F5EE' : '#FDECEA', borderColor: passed ? '#A8D5B5' : '#F5B8BC' },
        ]}>
          <View style={styles.scoreLeft}>
            <Text style={[styles.scoreLabel, { color: passed ? '#1E8C4E' : '#D93025' }]}>Calificación</Text>
            <Text style={[styles.scoreValue, { color: passed ? '#1E8C4E' : '#D93025' }]}>
              {calculatedScore !== null ? Number(calculatedScore).toFixed(1) : '—'}
            </Text>
            <View style={[styles.scoreBadge, { backgroundColor: passed ? '#1E8C4E' : '#D93025' }]}>
              <Text style={styles.scoreBadgeText}>{passed ? '✓ Aprobado' : '✗ Reprobado'}</Text>
            </View>
          </View>
          <View style={styles.scoreRight}>
            <View style={[styles.scoreCircle, { borderColor: passed ? '#1E8C4E' : '#D93025' }]}>
              <Text style={[styles.scoreCircleNum, { color: passed ? '#1E8C4E' : '#D93025' }]}>{correctCount}</Text>
              <Text style={[styles.scoreCircleDen, { color: passed ? '#1E8C4E' : '#D93025' }]}>/{definitiveCount}</Text>
            </View>
            <Text style={[styles.scoreCircleLabel, { color: passed ? '#1E8C4E' : '#D93025' }]}>correctos</Text>
          </View>
        </View>

        {/* PLAN PEDAGÓGICO */}
        {teachingPlan.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowPlan(!showPlan)}
            >
              <View style={[styles.sectionHeaderIcon, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>Plan pedagógico</Text>
              <Ionicons name={showPlan ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {showPlan && <TeachingPlanCard plan={teachingPlan} colors={colors} />}
          </>
        )}

        {/* PROBLEMAS */}
        <TouchableOpacity
          style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowProblems(!showProblems)}
        >
          <View style={[styles.sectionHeaderIcon, { backgroundColor: `${colors.secondary}12` }]}>
            <Ionicons name="list-outline" size={18} color={colors.secondary} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>
            Problemas ({problems.length})
          </Text>
          <Ionicons name={showProblems ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {showProblems && (
          <>
            {problems.length === 0 && (
              <View style={[styles.noProblems, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}25` }]}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[{ flex: 1, fontSize: 13, color: colors.warning }]}>
                  No se detectaron problemas automáticamente.
                </Text>
              </View>
            )}
            {problems.map((problem, index) => {
              const isCorrect = problem.isCorrect;
              const accentColor = isCorrect === true ? '#1E8C4E' : isCorrect === false ? '#D93025' : colors.textMuted;
              const bgColor = isCorrect === true ? '#E8F5EE' : isCorrect === false ? '#FDECEA' : colors.borderLight;
              return (
                <View key={problem.id} style={[styles.problemCard, {
                  backgroundColor: colors.surface,
                  borderColor: isCorrect === true ? '#A8D5B5' : isCorrect === false ? '#F5B8BC' : colors.borderLight,
                  borderLeftColor: accentColor,
                }]}>
                  <View style={styles.problemHeader}>
                    <View style={[styles.problemNumBox, { backgroundColor: bgColor }]}>
                      <Text style={[styles.problemNumText, { color: accentColor }]}>#{index + 1}</Text>
                    </View>
                    <View style={styles.problemMeta}>
                      {problem.section && problem.section !== 'General' && (
                        <Text style={[styles.problemSection, { color: colors.textMuted }]}>{problem.section}</Text>
                      )}
                      {problem.teacherOverride && (
                        <View style={[styles.overridePill, { backgroundColor: `${colors.warning}15` }]}>
                          <Text style={[styles.overridePillText, { color: colors.warning }]}>Corregido</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.toggleBtn, { backgroundColor: bgColor }]}
                      onPress={() => toggleProblem(problem.id)}
                    >
                      <Ionicons
                        name={isCorrect === true ? 'checkmark-circle' : 'close-circle'}
                        size={26} color={accentColor}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.problemOp, { color: colors.textPrimary }]}>
                    {problem.operation || problem.originalText}
                  </Text>
                  <View style={styles.answersRow}>
                    <View style={[styles.answerCard, { backgroundColor: '#FDECEA' }]}>
                      <Text style={[styles.answerCardLabel, { color: '#D93025' }]}>Estudiante</Text>
                      <Text style={[styles.answerCardValue, { color: '#D93025' }]}>{problem.studentAnswer ?? '-'}</Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={16} color={colors.textMuted} />
                    <View style={[styles.answerCard, { backgroundColor: '#E8F5EE' }]}>
                      <Text style={[styles.answerCardLabel, { color: '#1E8C4E' }]}>Correcto</Text>
                      <Text style={[styles.answerCardValue, { color: '#1E8C4E' }]}>{problem.correctAnswer ?? '-'}</Text>
                    </View>
                  </View>
                  <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                    Toca ✓/✗ para corregir manualmente
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {/* NOTAS DEL DOCENTE */}
        <View style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderIcon, { backgroundColor: `${colors.accent}12` }]}>
            <Ionicons name="create-outline" size={18} color={colors.accent} />
          </View>
          <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>Notas del docente</Text>
        </View>
        <View style={[styles.notesBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.textPrimary }]}
            placeholder="Observaciones sobre el desempeño del estudiante..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={teacherNotes}
            onChangeText={setTeacherNotes}
            textAlignVertical="top"
          />
        </View>

        <Button
          label={`Guardar calificación${calculatedScore !== null ? ` (${Number(calculatedScore).toFixed(1)})` : ''}`}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 16 }}
        />
        <Button label="Volver" onPress={() => router.back()} variant="ghost" />
        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  // Pantalla de procesando
  processingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  processingTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  processingSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  // Score card
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 20, borderWidth: 1.5, padding: 20, marginTop: 16, marginBottom: 16,
  },
  scoreLeft: { gap: 8 },
  scoreLabel: { fontSize: 13, fontWeight: '600' },
  scoreValue: { fontSize: 64, fontWeight: '900', lineHeight: 68 },
  scoreBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  scoreBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  scoreRight: { alignItems: 'center', gap: 6 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  scoreCircleNum: { fontSize: 28, fontWeight: '900' },
  scoreCircleDen: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  scoreCircleLabel: { fontSize: 12, fontWeight: '600' },
  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 12, marginBottom: 4 },
  sectionHeaderIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionHeaderText: { flex: 1, fontSize: 15, fontWeight: '700' },
  // Plan
  planContainer: { gap: 10, marginBottom: 4 },
  planSuccess: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  planSuccessIcon: { fontSize: 28 },
  planSuccessTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  planSuccessText: { fontSize: 13, lineHeight: 20 },
  planBlock: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, overflow: 'hidden' },
  planBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 },
  planEmoji: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planEmojiText: { fontSize: 22 },
  planTopicName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  planExamplePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  planExampleText: { fontSize: 12, fontWeight: '600' },
  planTips: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  planTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  planTipDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planTipDotText: { fontSize: 14 },
  planTipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  // Problemas
  noProblems: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  problemCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginBottom: 10, gap: 10 },
  problemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  problemNumBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  problemNumText: { fontSize: 13, fontWeight: '800' },
  problemMeta: { flex: 1, gap: 4 },
  problemSection: { fontSize: 11, fontWeight: '600' },
  overridePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  overridePillText: { fontSize: 11, fontWeight: '600' },
  toggleBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  problemOp: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  answersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  answerCardLabel: { fontSize: 11, fontWeight: '600' },
  answerCardValue: { fontSize: 20, fontWeight: '900' },
  toggleHint: { fontSize: 11, textAlign: 'right' },
  // Notas
  notesBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, minHeight: 100 },
  notesInput: { fontSize: 14, lineHeight: 21, minHeight: 80 },
});
