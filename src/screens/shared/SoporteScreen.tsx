import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, TextInput, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, AppFooter } from '@/src/components/ui';

const QUICK_TOPICS = [
  'Problema con el OCR',
  'Error al crear estudiante',
  'No puedo iniciar sesión',
  'Examen calificado incorrectamente',
  'Problema con fotos',
  'Otro',
];

export default function SoporteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { request, loading } = useApi();

  const [selectedTopic, setSelectedTopic] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ message?: string }>({});

  const validate = () => {
    const e: { message?: string } = {};
    if (!message.trim()) e.message = 'Describe el problema';
    if (message.trim().length < 10) e.message = 'Mínimo 10 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    const fullMessage = selectedTopic && selectedTopic !== 'Otro'
      ? `[${selectedTopic}]\n\n${message}`
      : message;
    const result = await request('/soporte', {
      method: 'POST',
      body: { message: fullMessage.trim() },
    });
    if (result) setSent(true);
    else Alert.alert('Error', 'No se pudo enviar. Intenta de nuevo.');
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar title="Soporte" showBack />
        <View style={styles.successScreen}>
          <View style={[styles.successIcon, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>¡Mensaje enviado!</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            El equipo de EMAI-APP revisará tu reporte.
          </Text>
          <Button label="Volver" onPress={() => router.back()} style={{ marginTop: 24, width: 180 }} fullWidth={false} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Contactar soporte" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: `${colors.primary}0D` }]}>
          <Ionicons name="headset-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>¿Tienes un problema?</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Cuéntanos qué pasó.</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TEMA (OPCIONAL)</Text>
        <View style={styles.topicsGrid}>
          {QUICK_TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[styles.topicChip, { borderColor: colors.border, backgroundColor: colors.surface },
                selectedTopic === topic && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedTopic(selectedTopic === topic ? '' : topic)}
            >
              <Text style={[styles.topicText, { color: selectedTopic === topic ? '#FFF' : colors.textSecondary }]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DESCRIBE EL PROBLEMA</Text>
        <View style={[styles.messageBox, { borderColor: errors.message ? colors.error : colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.messageInput, { color: colors.textPrimary }]}
            placeholder="Describe detalladamente qué ocurrió..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{message.length}/1000</Text>
        </View>
        {errors.message && <Text style={[styles.errorText, { color: colors.error }]}>{errors.message}</Text>}

        <View style={[styles.senderInfo, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.senderText, { color: colors.textSecondary }]}>
            Se enviará como <Text style={{ fontWeight: '700', color: colors.textPrimary }}>@{user?.username}</Text>
          </Text>
        </View>

        <Button label="Enviar mensaje" onPress={handleSend} loading={loading} style={{ marginTop: 8 }} />
        <Button label="Cancelar" onPress={() => router.back()} variant="ghost" />
        <View style={{ marginTop: 32 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800' },
  successText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, marginTop: 16, marginBottom: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 20, marginBottom: 12 },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topicText: { fontSize: 13, fontWeight: '600' },
  messageBox: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, minHeight: 140 },
  messageInput: { fontSize: 15, lineHeight: 22, minHeight: 110 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  errorText: { fontSize: 12, marginTop: 4 },
  senderInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12, marginBottom: 8 },
  senderText: { fontSize: 13 },
});
