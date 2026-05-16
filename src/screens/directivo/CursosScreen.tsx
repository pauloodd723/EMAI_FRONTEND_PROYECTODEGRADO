import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  ScrollView, Alert, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';

export default function CursosScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqAssign } = useApi();

  const [courses, setCourses] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    const [c, d] = await Promise.all([
      request('/directivo/cursos'),
      request('/directivo/usuarios'),
    ]);
    if (c) setCourses(c);
    if (d) setDocentes((d as any[]).filter((u: any) => u.role === 'docente'));
  }, [request]);

  useEffect(() => { fetchAll(); }, []);
  useAutoRefresh(fetchAll);

  const handleAssign = async (courseId: string, teacherId: string | null) => {
    const result = await reqAssign(`/directivo/cursos/${courseId}/asignar`, {
      method: 'PATCH',
      body: { teacherId },
    });
    if (result) { setAssigningCourse(null); fetchAll(); }
    else Alert.alert('Error', 'No se pudo asignar el docente');
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    Alert.alert('Eliminar', `¿Eliminar "${courseName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await reqAssign(`/directivo/cursos/${courseId}`, { method: 'DELETE' });
          fetchAll();
        },
      },
    ]);
  };

  const getTeacherName = (teacherId: string | null | undefined): string | null => {
    if (!teacherId) return null;
    const doc = docentes.find((d) => d.id === teacherId);
    return doc ? (doc.fullName ?? doc.full_name ?? doc.username) : null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Cursos" showBack />

      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Button
            label="+ Crear curso"
            onPress={() => setShowCreate(true)}
            variant="outline"
            style={{ marginBottom: 12 }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aún no hay cursos. Crea el primero.
            </Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => {
          const teacherName = getTeacherName(item.teacherId ?? item.teacher_id);
          const courseName: string = item.name ?? `${item.grade}-${item.group}`;
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={[styles.courseIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.courseIconText, { color: colors.primary }]}>{item.name}</Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: colors.textPrimary }]}>
                  Grado {item.grade} — Grupo {item.group}
                </Text>
                <Text style={[styles.rowSub, { color: teacherName ? colors.success : colors.textMuted }]}>
                  {teacherName ? `Docente: ${teacherName}` : 'Sin docente asignado'}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}12` }]}
                  onPress={() => setAssigningCourse(item)}
                >
                  <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: `${colors.error}12` }]}
                  onPress={() => handleDelete(item.id, courseName)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {showCreate && (
        <CreateCourseModal
          colors={colors}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      {assigningCourse && (
        <AssignTeacherModal
          course={assigningCourse}
          docentes={docentes}
          colors={colors}
          onClose={() => setAssigningCourse(null)}
          onAssign={(teacherId: string | null) => handleAssign(assigningCourse.id, teacherId)}
        />
      )}
    </View>
  );
}

// ─── MODAL CREAR CURSO ────────────────────────────────────────────────────────
function CreateCourseModal({ colors, onClose, onCreated }: {
  colors: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { request, loading } = useApi();
  const [grade, setGrade] = useState('');
  const [group, setGroup] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const preview = grade && group ? `${grade}-${group}` : '—';

  const handleCreate = async () => {
    const e: Record<string, string> = {};
    if (!grade.trim()) e.grade = 'Requerido';
    if (!group.trim()) e.group = 'Requerido';
    setErrors(e);
    if (Object.keys(e).length) return;

    const result = await request('/directivo/cursos', {
      method: 'POST',
      body: { grade: grade.trim(), group: group.trim(), name: `${grade.trim()}-${group.trim()}` },
    });
    if (result) onCreated();
    else Alert.alert('Error', 'No se pudo crear el curso');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo curso</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.previewBox, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.previewCourse, { color: colors.primary }]}>{preview}</Text>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Vista previa</Text>
          </View>
          <Input
            label="Grado"
            placeholder="Ej: 1, 2, 3..."
            value={grade}
            onChangeText={setGrade}
            keyboardType="numeric"
            error={errors.grade}
          />
          <Input
            label="Grupo"
            placeholder="Ej: 1, 2, A, B..."
            value={group}
            onChangeText={setGroup}
            error={errors.group}
          />
          <Button label="Crear curso" onPress={handleCreate} loading={loading} />
          <Button label="Cancelar" onPress={onClose} variant="ghost" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── MODAL ASIGNAR DOCENTE ────────────────────────────────────────────────────
function AssignTeacherModal({ course, docentes, colors, onClose, onAssign }: {
  course: any;
  docentes: any[];
  colors: any;
  onClose: () => void;
  onAssign: (teacherId: string | null) => void;
}) {
  const courseName: string = course.name ?? `${course.grade}-${course.group}`;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Asignar docente</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={[styles.assignSubtitle, { color: colors.textSecondary }]}>
            Curso:{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>{courseName}</Text>
          </Text>

          {/* Sin docente */}
          <TouchableOpacity
            style={[styles.docenteRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onAssign(null)}
          >
            <View style={[styles.docenteIcon, { backgroundColor: `${colors.textMuted}15` }]}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
            </View>
            <Text style={[styles.docenteName, { color: colors.textMuted }]}>Sin docente asignado</Text>
          </TouchableOpacity>

          {docentes.length === 0 && (
            <View style={styles.empty}>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
                No hay docentes creados aún.
              </Text>
            </View>
          )}

          {docentes.map((d: any) => {
            const name: string = d.fullName ?? d.full_name ?? d.username ?? '?';
            const currentTeacherId: string | null = course.teacherId ?? course.teacher_id ?? null;
            const isAssigned = currentTeacherId === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.docenteRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isAssigned ? colors.primary : colors.border,
                    borderWidth: isAssigned ? 2 : 1,
                  },
                ]}
                onPress={() => onAssign(d.id)}
              >
                <View style={[styles.docenteIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docenteName, { color: colors.textPrimary }]}>{name}</Text>
                  <Text style={[styles.docenteUser, { color: colors.textSecondary }]}>@{d.username}</Text>
                </View>
                {isAssigned && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}

          <Button label="Cancelar" onPress={onClose} variant="ghost" style={{ marginTop: 16 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    borderWidth: 1, padding: 14, gap: 12,
  },
  courseIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  courseIconText: { fontSize: 15, fontWeight: '800' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 3 },
  rowActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  previewBox: { alignItems: 'center', borderRadius: 16, padding: 24, marginBottom: 24 },
  previewCourse: { fontSize: 36, fontWeight: '900' },
  previewLabel: { fontSize: 12, marginTop: 4 },
  assignSubtitle: { fontSize: 15, marginBottom: 16 },
  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  docenteIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docenteName: { fontSize: 15, fontWeight: '700' },
  docenteUser: { fontSize: 12, marginTop: 2 },
});
