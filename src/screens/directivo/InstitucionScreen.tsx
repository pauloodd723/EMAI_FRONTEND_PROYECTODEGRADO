import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../hooks/useApi';
import { TopBar } from '../../components/TopBar';
import { Button, Input, AppFooter } from '../../components/ui';

const PRESET_COLORS = [
  { name: 'Azul',     hex: '#1A3C5E' },
  { name: 'Café',     hex: '#5C3A1E' },
  { name: 'Verde',    hex: '#1A5E3C' },
  { name: 'Rojo',     hex: '#7B1D1D' },
  { name: 'Morado',   hex: '#3D1A7A' },
  { name: 'Naranja',  hex: '#8C4A00' },
  { name: 'Gris',     hex: '#374151' },
  { name: 'Marino',   hex: '#1E3A5F' },
];

export default function InstitucionScreen() {
  const router = useRouter();
  const { institution, updateInstitution } = useAuth();
  const { colors, setInstitutionColors } = useTheme();
  const { request, loading } = useApi();

  const [name, setName] = useState(institution?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(institution?.primaryColor ?? '#1A3C5E');
  const [nameError, setNameError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('El nombre es requerido');
      return;
    }
    setNameError('');

    const result = await request('/directivo/institucion', {
      method: 'PATCH',
      body: { name: name.trim(), primaryColor: selectedColor },
    });

    if (result) {
      setInstitutionColors(selectedColor, selectedColor);
      updateInstitution({ name: name.trim(), primaryColor: selectedColor });
      Alert.alert('✓ Guardado', 'La configuración se actualizó correctamente.');
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Configurar institución" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PREVIEW */}
        <View style={[styles.preview, { backgroundColor: selectedColor }]}>
          <View style={styles.previewLogo}>
            <Ionicons name="school-outline" size={32} color="#FFF" />
          </View>
          <Text style={styles.previewName}>{name || 'Nombre de la institución'}</Text>
          <Text style={styles.previewSub}>Vista previa</Text>
        </View>

        {/* NOMBRE */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATOS GENERALES</Text>
        <Input
          label="Nombre de la institución"
          placeholder="Ej: I.E. Colegio Nacional"
          value={name}
          onChangeText={setName}
          error={nameError}
          leftIcon={<Ionicons name="business-outline" size={18} color={colors.textMuted} />}
        />

        {/* COLOR */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>COLOR INSTITUCIONAL</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Este color se aplicará en toda la app para esta institución.
        </Text>

        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c.hex}
              style={[
                styles.colorChip,
                { backgroundColor: c.hex },
                selectedColor === c.hex && styles.colorChipSelected,
              ]}
              onPress={() => setSelectedColor(c.hex)}
              activeOpacity={0.85}
            >
              {selectedColor === c.hex && (
                <Ionicons name="checkmark" size={18} color="#FFF" />
              )}
              <Text style={styles.colorLabel}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Guardar cambios"
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: 24 }}
        />

        <View style={{ marginTop: 32 }}>
          <AppFooter />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  preview: {
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 32,
    marginVertical: 20,
    gap: 8,
  },
  previewLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  previewName: { color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: 'center', paddingHorizontal: 24 },
  previewSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 16, marginBottom: 12 },
  hint: { fontSize: 13, marginBottom: 16, marginTop: -8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorChip: {
    width: '22%',
    aspectRatio: 1.4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  colorChipSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  colorLabel: { color: '#FFF', fontSize: 10, fontWeight: '600' },
});
