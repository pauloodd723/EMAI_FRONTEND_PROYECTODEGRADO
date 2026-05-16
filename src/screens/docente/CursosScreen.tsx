import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  Modal, ScrollView, Alert, TextInput, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';
import { PASSING_GRADE } from '@/src/constants';

// ─── EXCEL ────────────────────────────────────────────────────────────────────
async function exportToExcel(courseId: string, grade: string, group: string, token: string) {
  try {
    const { API_BASE_URL } = require('@/src/constants');
    const Sharing = require('expo-sharing');
    const FS = require('expo-file-system/legacy');
    const url = `${API_BASE_URL}/docente/cursos/${courseId}/exportar-xlsx`;
    const fileName = `notas_${grade}-${group}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileUri = (FS.documentDirectory || FS.cacheDirectory || '') + fileName;
    const downloadResult = await FS.downloadAsync(url, fileUri, {
      headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
    });
    if (downloadResult.status !== 200) { Alert.alert('Error', `No se pudo descargar (${downloadResult.status}).`); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Notas ${grade}-${group}`, UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      Alert.alert('Descargado', 'Archivo guardado en el dispositivo.');
    }
  } catch (e: any) {
    Alert.alert('Error', `No se pudo exportar: ${e?.message ?? e}`);
  }
}

// ─── MODAL LISTA EXÁMENES ─────────────────────────────────────────────────────
function ExamsListModal({ courseId, colors, onClose }: { courseId: string; colors: any; onClose: () => void }) {
  const { request } = useApi<any[]>();
  const { request: reqDelete } = useApi();
  const { request: reqRename } = useApi();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [newName, setNewName] = useState('');

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const data = await request(`/docente/cursos/${courseId}/examenes`);
    if (data) setExams(data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = (exam: any) => {
    Alert.alert('Eliminar examen', `Se eliminará "${exam.name}" para TODOS los estudiantes. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await reqDelete(`/docente/examenes/${exam.id}`, { method: 'DELETE' }); fetchExams(); } },
    ]);
  };

  const handleRename = async () => {
    if (!newName.trim() || !editingExam) return;
    await reqRename(`/docente/examenes/${editingExam.id}`, { method: 'PATCH', body: { name: newName.trim() } });
    setEditingExam(null); setNewName(''); fetchExams();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Exámenes del curso</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : exams.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-outline" size={44} color={colors.textMuted} />
            <Text style={[{ color: colors.textMuted, marginTop: 12 }]}>No hay exámenes aún.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {exams.map((exam) => (
              <View key={exam.id} style={[styles.examListItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={[styles.examListIcon, { backgroundColor: `${colors.primary}12` }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.examListInfo}>
                  <Text style={[styles.examListName, { color: colors.textPrimary }]}>{exam.name}</Text>
                  <Text style={[styles.examListDate, { color: colors.textMuted }]}>
                    {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('es-CO') : '—'}
                  </Text>
                </View>
                <View style={styles.examListActions}>
                  <TouchableOpacity style={[styles.examActionBtn, { backgroundColor: `${colors.primary}12` }]}
                    onPress={() => { setEditingExam(exam); setNewName(exam.name); }}>
                    <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.examActionBtn, { backgroundColor: `${colors.error}12` }]}
                    onPress={() => handleDelete(exam)}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      {editingExam && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setEditingExam(null)}>
          <View style={styles.overlayCenter}>
            <View style={[styles.renameCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.renameTitle, { color: colors.textPrimary }]}>Renombrar examen</Text>
              <TextInput
                style={[styles.renameInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                value={newName} onChangeText={setNewName} autoFocus
              />
              <View style={styles.renameActions}>
                <TouchableOpacity style={[styles.renameBtn, { borderColor: colors.border }]} onPress={() => { setEditingExam(null); setNewName(''); }}>
                  <Text style={[{ color: colors.textSecondary, fontWeight: '600' }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.renameBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleRename}>
                  <Text style={[{ color: '#FFF', fontWeight: '700' }]}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

// ─── MODAL EXPORTAR ───────────────────────────────────────────────────────────
function ExportModal({ course, colors, onClose }: { course: any; colors: any; onClose: () => void }) {
  const { token } = useAuth();
  const { request: reqPreview } = useApi<any>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await reqPreview(`/docente/cursos/${course.id}/exportar-notas`);
      if (d) setData(d);
      setLoading(false);
    })();
  }, []);

  const handleExport = async () => {
    if (!data || !token) return;
    setExporting(true);
    await exportToExcel(course.id, data.grade, data.group, token);
    setExporting(false);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Exportar notas</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={[{ color: colors.textMuted, marginTop: 12 }]}>Cargando datos...</Text></View>
        ) : data ? (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.exportSummary, { backgroundColor: `${colors.primary}0D` }]}>
              <Ionicons name="school-outline" size={28} color={colors.primary} />
              <View>
                <Text style={[styles.exportSummaryTitle, { color: colors.primary }]}>Curso {data.grade}-{data.group}</Text>
                <Text style={[styles.exportSummaryMeta, { color: colors.textSecondary }]}>
                  {data.rows?.length ?? 0} estudiante(s) · {data.exams?.length ?? 0} examen(es)
                </Text>
              </View>
            </View>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>VISTA PREVIA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.table, { borderColor: colors.borderLight }]}>
                <View style={[styles.tableRow, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.tableCell, styles.tableCellFirst, styles.tableHeaderText]}>Estudiante</Text>
                  {(data.exams ?? []).map((e: string, i: number) => (
                    <Text key={i} style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={2}>{e}</Text>
                  ))}
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Prom.</Text>
                </View>
                {(data.rows ?? []).map((row: any, ri: number) => (
                  <View key={ri} style={[styles.tableRow, { backgroundColor: ri % 2 === 0 ? colors.surface : `${colors.primary}05` }]}>
                    <Text style={[styles.tableCell, styles.tableCellFirst, styles.tableCellName, { color: colors.textPrimary }]} numberOfLines={1}>{row.studentName}</Text>
                    {(row.exams ?? []).map((e: any, ei: number) => {
                      const score = e.score;
                      const passed = score !== null && score >= 3.0;
                      return <Text key={ei} style={[styles.tableCell, styles.tableCellScore, { color: score !== null ? (passed ? '#1E8C4E' : '#D93025') : colors.textMuted, fontWeight: score !== null ? '700' : '400' }]}>{score !== null ? Number(score).toFixed(1) : '—'}</Text>;
                    })}
                    <Text style={[styles.tableCell, styles.tableCellScore, { color: row.average !== null ? (row.average >= 3.0 ? '#1E8C4E' : '#D93025') : colors.textMuted, fontWeight: '800' }]}>{row.average !== null ? Number(row.average).toFixed(1) : '—'}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={[styles.exportNote, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.exportNoteText, { color: colors.textSecondary }]}>Se descargará un archivo .xlsx que puedes abrir en Excel con colores y formato.</Text>
            </View>
            <Button label={exporting ? "Generando..." : "⬇ Descargar Excel (.xlsx)"} onPress={handleExport} loading={exporting} style={{ marginTop: 8 }} />
            <Button label="Cancelar" onPress={onClose} variant="ghost" />
          </ScrollView>
        ) : (
          <View style={styles.center}><Text style={[{ color: colors.textMuted }]}>No se pudieron cargar los datos.</Text></View>
        )}
      </View>
    </Modal>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function DocenteCursosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqAll } = useApi<any[]>();
  const { request: reqGrades } = useApi<any>();

  const [courses, setCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [courseAverages, setCourseAverages] = useState<Record<string, number | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [exportingCourse, setExportingCourse] = useState<any | null>(null);
  const [examsListCourse, setExamsListCourse] = useState<any | null>(null);

  const fetchCourses = useCallback(async () => {
    const [mine, all] = await Promise.all([request('/docente/cursos'), reqAll('/docente/cursos/todos')]);
    if (mine) setCourses(mine);
    if (all) setAllCourses(all);
    return mine ?? [];
  }, []);

  const fetchAverages = useCallback(async (myCourses: any[]) => {
    const map: Record<string, number | null> = {};
    await Promise.all(myCourses.map(async (course) => {
      try {
        const data = await reqGrades(`/docente/cursos/${course.id}/exportar-notas`);
        if (data?.rows) {
          const allScores = data.rows
            .map((r: any) => r.average)
            .filter((a: any) => a !== null && a !== undefined);
          map[course.id] = allScores.length > 0
            ? Math.round((allScores.reduce((s: number, a: number) => s + a, 0) / allScores.length) * 10) / 10
            : null;
        }
      } catch {}
    }));
    setCourseAverages(map);
  }, []);

  useEffect(() => {
    fetchCourses().then((mine) => { if (mine?.length > 0) fetchAverages(mine); });
  }, []);
  useAutoRefresh(fetchCourses);

  if (selected) {
    return <EstudiantesScreen course={selected} onBack={() => setSelected(null)} />;
  }

  const hasCourses = courses.length > 0;
  const displayCourses = hasCourses ? courses : allCourses;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Mis Cursos" showBack />
      <FlatList
        data={displayCourses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); const mine = await fetchCourses(); if (mine?.length > 0) fetchAverages(mine); setRefreshing(false); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          !hasCourses && allCourses.length > 0 ? (
            <View style={[styles.infoBanner, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}25` }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
              <Text style={[styles.infoText, { color: colors.warning }]}>No tienes cursos asignados. Pide al directivo que te asigne uno.</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay cursos en la institución.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const isMine = courses.some((c) => c.id === item.id);
          const isAssigned = (item.teacherId ?? item.teacher_id) !== null;
          const promedio = courseAverages[item.id] ?? null;
          const passed = promedio !== null && promedio >= PASSING_GRADE;

          return (
            <View style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: isMine ? colors.primary : colors.borderLight, borderWidth: isMine ? 2 : 1 }]}>
              <TouchableOpacity style={styles.courseCardMain} onPress={() => isMine ? setSelected(item) : null} activeOpacity={isMine ? 0.82 : 1}>
                <View style={[styles.courseIconBox, { backgroundColor: `${isMine ? colors.primary : colors.textMuted}15` }]}>
                  <Text style={[styles.courseIconText, { color: isMine ? colors.primary : colors.textMuted }]}>{item.name}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={[styles.courseName, { color: colors.textPrimary }]}>Grado {item.grade} — Grupo {item.group}</Text>
                  <Text style={[styles.courseSub, { color: isMine ? colors.success : colors.textMuted }]}>
                    {isMine ? '✓ Asignado a ti' : isAssigned ? 'Asignado a otro docente' : 'Sin docente asignado'}
                  </Text>
                  {/* PROMEDIO DEL CURSO */}
                  {isMine && promedio !== null && (
                    <View style={styles.promedioRow}>
                      <Text style={[styles.promedioLabel, { color: colors.textSecondary }]}>Promedio del curso:</Text>
                      <Text style={[styles.promedioValue, { color: passed ? colors.success : colors.error }]}>
                        {Number(promedio).toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {isMine && promedio === null && (
                    <Text style={[styles.courseSub, { color: colors.textMuted }]}>Sin calificaciones aún</Text>
                  )}
                </View>
                {isMine && <Ionicons name="chevron-forward" size={18} color={colors.primary} />}
              </TouchableOpacity>

              {isMine && (
                <View style={[styles.courseActions, { borderTopColor: colors.borderLight }]}>
                  <TouchableOpacity style={[styles.courseActionBtn, { backgroundColor: `${colors.primary}10` }]} onPress={() => setExamsListCourse(item)}>
                    <Ionicons name="document-text-outline" size={15} color={colors.primary} />
                    <Text style={[styles.courseActionText, { color: colors.primary }]}>Exámenes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.courseActionBtn, { backgroundColor: `${colors.success}10` }]} onPress={() => setExportingCourse(item)}>
                    <Ionicons name="download-outline" size={15} color={colors.success} />
                    <Text style={[styles.courseActionText, { color: colors.success }]}>Exportar notas</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
      {exportingCourse && <ExportModal course={exportingCourse} colors={colors} onClose={() => setExportingCourse(null)} />}
      {examsListCourse && <ExamsListModal courseId={examsListCourse.id} colors={colors} onClose={() => setExamsListCourse(null)} />}
    </View>
  );
}

// ─── PANTALLA ESTUDIANTES ────────────────────────────────────────────────────
function EstudiantesScreen({ course, onBack }: { course: any; onBack: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqGrades } = useApi<any>();
  const [students, setStudents] = useState<any[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, number | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStudents = useCallback(async () => {
    const data = await request(`/docente/cursos/${course.id}/estudiantes`);
    if (data) setStudents(data as any[]);
  }, [course.id]);

  const fetchGrades = useCallback(async (studs: any[]) => {
    try {
      const data = await reqGrades(`/docente/cursos/${course.id}/exportar-notas`);
      if (data?.rows) {
        const map: Record<string, number | null> = {};
        for (const row of data.rows) {
          const s = studs.find((s) => (s.fullName ?? s.full_name) === row.studentName);
          if (s) map[s.id] = row.average ?? null;
        }
        setGradesMap(map);
      }
    } catch {}
  }, [course.id]);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { if (students.length > 0) fetchGrades(students); }, [students]);
  useAutoRefresh(fetchStudents);

  const filtered = students.filter((s) =>
    (s.fullName ?? s.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title={`Curso ${course.name}`} showBack onBack={onBack} />
      <View style={[styles.quickActions, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: `${colors.primary}12` }]} onPress={() => setShowCreate(true)}>
          <Ionicons name="person-add-outline" size={16} color={colors.primary} />
          <Text style={[styles.quickBtnText, { color: colors.primary }]}>Agregar estudiante</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { backgroundColor: `${colors.secondary}12` }]}
          onPress={() => router.push({ pathname: '/(docente)/crear-examen', params: { courseId: course.id } })}>
          <Ionicons name="document-text-outline" size={16} color={colors.secondary} />
          <Text style={[styles.quickBtnText, { color: colors.secondary }]}>Nuevo examen</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={`Buscar en ${course.name}...`} placeholderTextColor={colors.textMuted}
          value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchStudents(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListHeaderComponent={<Text style={[styles.listCount, { color: colors.textMuted }]}>{filtered.length} estudiante(s)</Text>}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={44} color={colors.textMuted} /><Text style={[styles.emptyText, { color: colors.textMuted }]}>Aún no hay estudiantes.</Text></View>}
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const name: string = item.fullName ?? item.full_name ?? '?';
          const photoUrl: string | null = item.photoUrl ?? item.photo_url ?? null;
          const promedio = gradesMap[item.id] ?? null;
          const passed = promedio !== null && promedio >= PASSING_GRADE;
          const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
          return (
            <TouchableOpacity style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push({ pathname: '/(docente)/estudiante', params: { id: item.id, courseId: course.id } })} activeOpacity={0.82}>
              <View style={styles.studentPhotoWrap}>
                {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.studentPhoto} resizeMode="cover" />
                  : <View style={[styles.studentPhotoPlaceholder, { backgroundColor: colors.primary }]}><Text style={styles.studentPhotoInitials}>{initials || '?'}</Text></View>}
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
                {promedio !== null
                  ? <View style={styles.promedioRow}><Text style={[styles.promedioLabel, { color: colors.textSecondary }]}>Promedio:</Text><Text style={[styles.promedioValue, { color: passed ? colors.success : colors.error }]}>{Number(promedio).toFixed(1)}</Text></View>
                  : <Text style={[styles.studentSub, { color: colors.textMuted }]}>Sin calificaciones</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        }}
      />
      {showCreate && <CreateStudentModal courseId={course.id} colors={colors} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchStudents(); }} />}
    </View>
  );
}

// ─── MODAL CREAR ESTUDIANTE ───────────────────────────────────────────────────
function CreateStudentModal({ courseId, colors, onClose, onCreated }: { courseId: string; colors: any; onClose: () => void; onCreated: () => void }) {
  const { request, loading } = useApi();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const handleCreate = async () => {
    if (!fullName.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    const result = await request('/docente/estudiantes', { method: 'POST', body: { fullName: fullName.trim(), courseId } });
    if (result) onCreated(); else Alert.alert('Error', 'No se pudo crear el estudiante');
  };
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo estudiante</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Input label="Nombre completo del estudiante" placeholder="Ej: Ana María López"
            value={fullName} onChangeText={setFullName} error={error}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />} />
          <Button label="Crear estudiante" onPress={handleCreate} loading={loading} />
          <Button label="Cancelar" onPress={onClose} variant="ghost" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  listCount: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  courseCard: { borderRadius: 16, overflow: 'hidden' },
  courseCardMain: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  courseIconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  courseIconText: { fontSize: 16, fontWeight: '900' },
  courseInfo: { flex: 1, gap: 3 },
  courseName: { fontSize: 16, fontWeight: '700' },
  courseSub: { fontSize: 12 },
  promedioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  promedioLabel: { fontSize: 12 },
  promedioValue: { fontSize: 18, fontWeight: '900' },
  courseActions: { flexDirection: 'row', borderTopWidth: 1 },
  courseActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  courseActionText: { fontSize: 13, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  quickBtnText: { fontSize: 13, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  studentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 14 },
  studentPhotoWrap: { flexShrink: 0 },
  studentPhoto: { width: 70, height: 70, borderRadius: 14 },
  studentPhotoPlaceholder: { width: 70, height: 70, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  studentPhotoInitials: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  studentSub: { fontSize: 12 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  examListItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  examListIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  examListInfo: { flex: 1 },
  examListName: { fontSize: 15, fontWeight: '700' },
  examListDate: { fontSize: 11, marginTop: 2 },
  examListActions: { flexDirection: 'row', gap: 8 },
  examActionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  renameCard: { width: '100%', borderRadius: 20, padding: 24, gap: 16 },
  renameTitle: { fontSize: 18, fontWeight: '800' },
  renameInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  renameActions: { flexDirection: 'row', gap: 12 },
  renameBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  exportSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginBottom: 16 },
  exportSummaryTitle: { fontSize: 18, fontWeight: '800' },
  exportSummaryMeta: { fontSize: 13, marginTop: 2 },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  table: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  tableRow: { flexDirection: 'row' },
  tableHeaderText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  tableCell: { width: 90, padding: 10, textAlign: 'center', fontSize: 13 },
  tableCellFirst: { width: 140, textAlign: 'left' },
  tableCellName: { fontWeight: '600' },
  tableCellScore: { fontWeight: '700' },
  exportNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  exportNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
