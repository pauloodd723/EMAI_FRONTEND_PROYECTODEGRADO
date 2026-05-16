import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, StyleSheet, Image, Alert, ActionSheetIOS, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { AppFooter } from '@/src/components/ui';
import { PASSING_GRADE } from '@/src/constants';

export default function EstudianteScreen() {
  const { id, courseId } = useLocalSearchParams<{ id: string; courseId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { request: reqStudent } = useApi<any>();
  const { request: reqResults } = useApi<any[]>();
  const { request: reqPatch } = useApi();
  const { request: reqDelete } = useApi();
  const { request: reqClear } = useApi();

  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [s, r] = await Promise.all([
      reqStudent(`/docente/estudiantes/${id}`),
      reqResults(`/docente/estudiantes/${id}/examenes`),
    ]);
    if (s) setStudent(s);
    if (r) setResults(r);
  }, [id]);

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll);

  const handleEditPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      await reqPatch(`/docente/estudiantes/${id}`, {
        method: 'PATCH',
        body: { photoUrl: result.assets[0].uri },
      });
      fetchAll();
    }
  };

  const handleExamOptions = (item: any) => {
    const examName = item.examName ?? 'Examen';
    const hasContent = item.status !== 'pending';

    if (!hasContent) {
      // Ya está pendiente, navegar directo a escanear
      router.push({
        pathname: '/(docente)/escanear',
        params: { studentId: id, examId: item.examId, examResultId: item.id, courseId: courseId ?? '' },
      });
      return;
    }

    Alert.alert(
      examName,
      '¿Qué deseas hacer con este examen?',
      [
        {
          text: '🔄 Volver a escanear',
          onPress: () => {
            Alert.alert(
              'Volver a escanear',
              'Esto eliminará el escaneo actual y sus resultados. ¿Continuar?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Continuar', style: 'destructive',
                  onPress: async () => {
                    await reqClear(`/docente/examenes/resultados/${item.id}/contenido`, { method: 'DELETE' });
                    fetchAll();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const validResults = results.filter((r) => r.finalScore !== null && r.finalScore !== undefined);
  const promedio = validResults.length > 0
    ? validResults.reduce((s, r) => s + Number(r.finalScore), 0) / validResults.length
    : null;

  const studentName = student?.fullName ?? student?.full_name ?? '?';
  const photoUrl = student?.photoUrl ?? student?.photo_url;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Estudiante" showBack />
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* ─── PERFIL ─────────────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={handleEditPhoto}
              activeOpacity={0.88}
            >
              {/* FOTO GRANDE SIN ARO */}
              <View style={styles.photoWrap}>
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.photoInitials}>
                      {studentName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')}
                    </Text>
                  </View>
                )}
                {/* Botón cámara sobre la foto */}
                <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={14} color="#FFF" />
                </View>
              </View>

              {/* INFO */}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {studentName}
                </Text>
                {promedio !== null ? (
                  <View style={styles.promedioRow}>
                    <Text style={[styles.promedioLabel, { color: colors.textSecondary }]}>Promedio</Text>
                    <Text style={[
                      styles.promedioValue,
                      { color: promedio >= PASSING_GRADE ? colors.success : colors.error },
                    ]}>
                      {Number(promedio).toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.promedioLabel, { color: colors.textMuted }]}>
                    Sin calificaciones aún
                  </Text>
                )}
                <Text style={[styles.tapHint, { color: colors.textMuted }]}>
                  Toca para cambiar foto
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              EXÁMENES ({results.length})
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No hay exámenes asignados.{'\n'}Crea un examen desde el dashboard.
            </Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const score = item.finalScore;
          const hasScore = score !== null && score !== undefined;
          const passed = hasScore && Number(score) >= PASSING_GRADE;
          const status: string = item.status ?? 'pending';
          const isPending = status === 'pending';
          const isProcessing = status === 'processing';

          return (
            <View style={[
              styles.examCard,
              {
                backgroundColor: colors.surface,
                borderColor: hasScore
                  ? (passed ? '#A8D5B5' : '#F5B8BC')
                  : colors.borderLight,
                borderLeftColor: hasScore
                  ? (passed ? colors.success : colors.error)
                  : isPending ? colors.primary : colors.textMuted,
              },
            ]}>
              <TouchableOpacity
                style={styles.examCardMain}
                onPress={() => {
                  if (isProcessing) return;
                  if (isPending) {
                    router.push({
                      pathname: '/(docente)/escanear',
                      params: { studentId: id, examId: item.examId, examResultId: item.id, courseId: courseId ?? '' },
                    });
                  } else {
                    router.push({
                      pathname: '/(docente)/revision-examen',
                      params: { resultId: item.id },
                    });
                  }
                }}
                activeOpacity={0.82}
              >
                {/* CAJÓN DE NOTA */}
                <View style={[
                  styles.scoreBox,
                  { backgroundColor: hasScore ? (passed ? '#E8F5EE' : '#FDECEA') : `${colors.primary}10` },
                ]}>
                  {isProcessing
                    ? <Ionicons name="hourglass-outline" size={24} color={colors.warning} />
                    : hasScore
                      ? <Text style={[styles.scoreText, { color: passed ? colors.success : colors.error }]}>
                          {Number(score).toFixed(1)}
                        </Text>
                      : <Ionicons name="scan-outline" size={24} color={colors.primary} />
                  }
                </View>

                {/* NOMBRE Y ESTADO */}
                <View style={styles.examInfo}>
                  <Text style={[styles.examName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.examName ?? 'Examen'}
                  </Text>
                  <Text style={[
                    styles.examStatus,
                    { color: isPending ? colors.primary : isProcessing ? colors.warning : colors.textSecondary },
                  ]}>
                    {isPending
                      ? '📷 Toca para escanear'
                      : isProcessing
                        ? '⏳ Procesando...'
                        : hasScore
                          ? (passed ? '✓ Aprobado' : '✗ Reprobado')
                          : 'Ver resultados'}
                  </Text>
                  {item.createdAt && (
                    <Text style={[styles.examDate, { color: colors.textMuted }]}>
                      {new Date(item.createdAt).toLocaleDateString('es-CO')}
                    </Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* BOTÓN RE-ESCANEAR (solo si tiene contenido) */}
              {item.status !== 'pending' && item.status !== 'processing' && (
                <TouchableOpacity
                  style={[styles.optionsBtn, { borderTopColor: colors.borderLight }]}
                  onPress={() => handleExamOptions(item)}
                >
                  <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.optionsBtnText, { color: colors.textMuted }]}>Volver a escanear</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12, paddingTop: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },

  // Perfil
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1,
    padding: 16, gap: 16, marginBottom: 8,
  },
  photoWrap: { position: 'relative' },
  photoImg: {
    width: 90, height: 90, borderRadius: 16,
    // Sin borde/aro
  },
  photoPlaceholder: {
    width: 90, height: 90, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  photoInitials: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  cameraBtn: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  promedioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promedioLabel: { fontSize: 13 },
  promedioValue: { fontSize: 28, fontWeight: '900' },
  tapHint: { fontSize: 11 },

  // Examen card
  examCard: {
    borderRadius: 16, borderWidth: 1, borderLeftWidth: 4,
    overflow: 'hidden',
  },
  examCardMain: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  scoreBox: {
    width: 64, height: 64, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  scoreText: { fontSize: 24, fontWeight: '900' },
  examInfo: { flex: 1, gap: 4 },
  examName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  examStatus: { fontSize: 13 },
  examDate: { fontSize: 11 },

  // Botón opciones
  optionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderTopWidth: 1,
  },
  optionsBtnText: { fontSize: 13, fontWeight: '500' },
});
