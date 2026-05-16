import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';

export default function CrearExamenScreen() {
  const router = useRouter();
  const { courseId: preselectedCourseId } = useLocalSearchParams<{ courseId?: string }>();
  const { colors } = useTheme();
  const { request: reqCourses } = useApi<any[]>();
  const { request: reqCreate, loading } = useApi();

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId ?? '');
  const [examName, setExamName] = useState('');
  const [errors, setErrors] = useState<{ course?: string; name?: string }>({});

  const fetchCourses = useCallback(async () => {
    const data = await reqCourses('/docente/cursos');
    if (data) setCourses(data);
  }, []);

  useEffect(() => { fetchCourses(); }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedCourseId) e.course = 'Selecciona un curso';
    if (!examName.trim()) e.name = 'El nombre del examen es requerido';
    if (examName.trim().length < 5) e.name = 'El nombre es muy corto';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const result = await reqCreate('/docente/examenes', {
      method: 'POST',
      body: { name: examName.trim(), courseId: selectedCourseId },
    });
    if (result) {
      Alert.alert('✓ Examen creado', `"${examName}" fue creado para todos los estudiantes.`, [
        { text: 'Escanear ahora', onPress: () => router.replace({ pathname: '/(docente)/escanear', params: { courseId: selectedCourseId } }) },
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo crear el examen.');
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Crear Examen" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}0E` }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            El examen se creará para <Text style={{ fontWeight: '700' }}>todos los estudiantes</Text> del curso seleccionado.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DATOS DEL EXAMEN</Text>
        <Input
          label="Nombre del examen"
          placeholder="Ej: Examen de factores segundo periodo"
          value={examName}
          onChangeText={setExamName}
          error={errors.name}
          leftIcon={<Ionicons name="document-text-outline" size={18} color={colors.textMuted} />}
        />

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CURSO</Text>
        {errors.course && <Text style={[styles.errorText, { color: colors.error }]}>{errors.course}</Text>}

        <View style={styles.courseGrid}>
          {courses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.courseChip, { borderColor: colors.border, backgroundColor: colors.surface },
                selectedCourseId === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCourseId(c.id)}
            >
              <Text style={[styles.courseChipText, { color: selectedCourseId === c.id ? '#FFF' : colors.textPrimary }]}>{c.name}</Text>
              <Text style={[styles.courseChipSub, { color: selectedCourseId === c.id ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>G{c.grade}-{c.group}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCourse && examName.trim() && (
          <View style={[styles.summary, { backgroundColor: `${colors.success}0C`, borderColor: `${colors.success}30` }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              "{examName}" para el curso {selectedCourse.name}
            </Text>
          </View>
        )}

        <Button label="Crear examen" onPress={handleCreate} loading={loading} style={{ marginTop: 24 }} />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" />
        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginTop: 16, marginBottom: 4 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 20, marginBottom: 12 },
  errorText: { fontSize: 12, marginBottom: 8, marginTop: -8 },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  courseChip: { width: '30%', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', gap: 4 },
  courseChipText: { fontSize: 16, fontWeight: '800' },
  courseChipSub: { fontSize: 11, fontWeight: '500' },
  summary: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  summaryText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
