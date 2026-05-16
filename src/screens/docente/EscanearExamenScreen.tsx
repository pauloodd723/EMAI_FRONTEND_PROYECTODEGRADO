import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { TopBar } from '@/src/components/TopBar';
import { Button, AppFooter } from '@/src/components/ui';
import { MAX_EXAM_IMAGES } from '@/src/constants';

type Step = 'capture' | 'processing' | 'done';

export default function EscanearExamenScreen() {
  const router = useRouter();
  const {
    studentId,
    examId,
    examResultId,
    courseId,
  } = useLocalSearchParams<{
    studentId?: string;
    examId?: string;
    examResultId?: string;
    courseId?: string;
  }>();
  const { colors } = useTheme();
  const { request, loading } = useApi<{ resultId: string }>();

  const [step, setStep] = useState<Step>('capture');
  const [images, setImages] = useState<string[]>([]);
  const [processingMsg, setProcessingMsg] = useState('Procesando imágenes...');

  const addFromCamera = async () => {
    if (images.length >= MAX_EXAM_IMAGES) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: false });
    if (!result.canceled) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const addFromGallery = async () => {
    if (images.length >= MAX_EXAM_IMAGES) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!result.canceled) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const uriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSend = async () => {
    if (images.length === 0) { Alert.alert('Sin imágenes', 'Agrega al menos una foto.'); return; }

    setStep('processing');
    const msgs = [
      'Procesando imágenes...',
      'Ejecutando OCR...',
      'Detectando problemas matemáticos...',
      'Calificando respuestas...',
      'Generando plan pedagógico...',
    ];
    let msgIdx = 0;
    const timer = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setProcessingMsg(msgs[msgIdx]);
    }, 2000);

    try {
      const base64Images = await Promise.all(images.map(uriToBase64));

      const result = await request('/docente/examenes/escanear', {
        method: 'POST',
        body: {
          studentId,
          examId,
          examResultId,   // ← Clave: actualiza el cajón existente
          courseId,
          images: base64Images,
        },
      });

      clearInterval(timer);

      if (result?.resultId) {
        setStep('done');
        setTimeout(() => {
          router.replace({
            pathname: '/(docente)/revision-examen',
            params: { resultId: result.resultId },
          });
        }, 800);
      } else {
        setStep('capture');
        Alert.alert('Error', 'No se pudo procesar el examen. Intenta de nuevo.');
      }
    } catch (e) {
      clearInterval(timer);
      setStep('capture');
      Alert.alert('Error de conexión', 'Verifica tu red e intenta de nuevo.');
    }
  };

  if (step === 'processing') {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.background }]}>
        <View style={[styles.processingCard, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>
            Analizando examen
          </Text>
          <Text style={[styles.processingMsg, { color: colors.textSecondary }]}>
            {processingMsg}
          </Text>
          <Text style={[styles.processingHint, { color: colors.textMuted }]}>
            Esto puede tardar unos segundos...
          </Text>
        </View>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.background }]}>
        <View style={[styles.processingCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>¡Listo!</Text>
          <Text style={[styles.processingMsg, { color: colors.textSecondary }]}>
            Abriendo resultados...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Escanear Examen" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.instrBox, { backgroundColor: `${colors.primary}0D` }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={[styles.instrText, { color: colors.primary }]}>
            Toma fotos con buena iluminación y el texto bien visible.
            Puedes agregar hasta {MAX_EXAM_IMAGES} páginas.
          </Text>
        </View>

        {/* IMÁGENES AGREGADAS */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={[styles.imagesLabel, { color: colors.textSecondary }]}>
              Páginas ({images.length}/{MAX_EXAM_IMAGES})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((uri, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <View style={[styles.pageLabel]}>
                    <Text style={styles.pageLabelText}>Pág. {i + 1}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_EXAM_IMAGES && (
                <TouchableOpacity
                  style={[styles.addThumb, { borderColor: colors.border }]}
                  onPress={addFromCamera}
                >
                  <Ionicons name="add" size={32} color={colors.textMuted} />
                  <Text style={[styles.addThumbText, { color: colors.textMuted }]}>
                    Pág. {images.length + 1}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* BOTONES DE CAPTURA */}
        {images.length === 0 && (
          <View style={styles.captureButtons}>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.primary }]}
              onPress={addFromCamera} activeOpacity={0.88}
            >
              <Ionicons name="camera" size={40} color="#FFF" />
              <Text style={styles.captureBtnText}>Usar cámara</Text>
              <Text style={styles.captureBtnSub}>Recomendado para mejor calidad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border }]}
              onPress={addFromGallery} activeOpacity={0.88}
            >
              <Ionicons name="images-outline" size={40} color={colors.primary} />
              <Text style={[styles.captureBtnText, { color: colors.textPrimary }]}>Desde galería</Text>
              <Text style={[styles.captureBtnSub, { color: colors.textSecondary }]}>Seleccionar imagen existente</Text>
            </TouchableOpacity>
          </View>
        )}

        {images.length > 0 && images.length < MAX_EXAM_IMAGES && (
          <View style={styles.addMoreRow}>
            <Button label="📷 Cámara" onPress={addFromCamera} variant="outline" fullWidth={false} style={{ flex: 1 }} />
            <Button label="🖼 Galería" onPress={addFromGallery} variant="outline" fullWidth={false} style={{ flex: 1 }} />
          </View>
        )}

        {images.length > 0 && (
          <>
            <View style={[styles.readyBanner, { backgroundColor: `${colors.success}0C`, borderColor: `${colors.success}25` }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={[styles.readyText, { color: colors.success }]}>
                {images.length} imagen{images.length > 1 ? 'es' : ''} lista{images.length > 1 ? 's' : ''} para procesar
              </Text>
            </View>
            <Button
              label="Procesar y calificar"
              onPress={handleSend}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </>
        )}

        <View style={{ marginTop: 32 }}><AppFooter /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  fullscreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  processingCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', gap: 16 },
  processingTitle: { fontSize: 22, fontWeight: '800' },
  processingMsg: { fontSize: 15, textAlign: 'center' },
  processingHint: { fontSize: 12, textAlign: 'center' },
  instrBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, marginTop: 16, marginBottom: 20 },
  instrText: { flex: 1, fontSize: 13, lineHeight: 19 },
  imagesSection: { marginBottom: 16 },
  imagesLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  thumbWrap: { position: 'relative', marginRight: 12 },
  thumb: { width: 110, height: 155, borderRadius: 10 },
  pageLabel: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pageLabelText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: -8, right: -8 },
  addThumb: { width: 110, height: 155, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addThumbText: { fontSize: 12 },
  captureButtons: { gap: 14, marginBottom: 16 },
  captureBtn: { borderRadius: 20, paddingVertical: 32, alignItems: 'center', gap: 8 },
  captureBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  captureBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  addMoreRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  readyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  readyText: { fontSize: 14, fontWeight: '600' },
});
