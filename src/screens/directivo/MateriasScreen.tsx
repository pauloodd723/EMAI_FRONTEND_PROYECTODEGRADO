import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { useAutoRefresh } from '@/src/hooks/useAutoRefresh';
import { TopBar } from '@/src/components/TopBar';
import { Button, Input, AppFooter } from '@/src/components/ui';

export default function MateriasScreen() {
  const { colors } = useTheme();
  const { request } = useApi<any[]>();
  const { request: reqCreate, loading } = useApi();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const fetchSubjects = useCallback(async () => {
    const data = await request('/directivo/materias');
    if (data) setSubjects(data);
  }, [request]);

  useEffect(() => { fetchSubjects(); }, []);
  useAutoRefresh(fetchSubjects);

  const handleCreate = async () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    const result = await reqCreate('/directivo/materias', {
      method: 'POST',
      body: { name: name.trim(), baseType: 'matematicas' },
    });
    if (result) {
      setShowCreate(false);
      setName('');
      fetchSubjects();
    } else {
      Alert.alert('Error', 'No se pudo crear la materia');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Materias" showBack />
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            label="+ Crear materia"
            onPress={() => setShowCreate(true)}
            variant="outline"
            style={{ marginBottom: 12 }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={44} color={colors.textMuted} />
            <Text style={[{ color: colors.textMuted, fontSize: 14 }]}>No hay materias aún.</Text>
          </View>
        }
        ListFooterComponent={<AppFooter />}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.rowBadge, { color: colors.textMuted }]}>{item.baseType ?? item.base_type}</Text>
          </View>
        )}
      />

      {showCreate && (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nueva materia</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Input
                label="Nombre"
                placeholder="Ej: Matemáticas"
                value={name}
                onChangeText={setName}
                error={error}
                leftIcon={<Ionicons name="book-outline" size={18} color={colors.textMuted} />}
              />
              <Button label="Crear materia" onPress={handleCreate} loading={loading} />
              <Button label="Cancelar" onPress={() => setShowCreate(false)} variant="ghost" />
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, paddingTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '700' },
  rowBadge: { fontSize: 12 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 24, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
});