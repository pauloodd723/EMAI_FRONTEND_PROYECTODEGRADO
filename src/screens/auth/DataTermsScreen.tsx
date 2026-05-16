import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, StyleSheet,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useApi } from '@/src/hooks/useApi';
import { Button, AppFooter } from '@/src/components/ui';
import { APP_VERSION } from '@/src/constants';

function TermsSection({ icon, title, children }: {
  icon: string; title: string; children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

export default function DataTermsScreen() {
  const router = useRouter();
  const { institution, updateInstitution } = useAuth();
  const { colors } = useTheme();
  const { request, loading } = useApi();
  const [showModal, setShowModal] = useState(false);

  const alreadyAccepted = institution?.dataTermsAccepted ?? false;

  const handleAccept = async () => {
    try {
      await request('/directivo/institucion', {
        method: 'PATCH',
        body: { dataTermsAccepted: true },
      });
    } catch {}
    updateInstitution({ dataTermsAccepted: true });
    setShowModal(false);
    Alert.alert(
      'Términos aceptados',
      'Has aceptado los términos de tratamiento de datos.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Tratamiento de datos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: `${alreadyAccepted ? colors.success : colors.primary}0D` }]}>
          <Ionicons
            name={alreadyAccepted ? 'shield-checkmark' : 'shield-outline'}
            size={36}
            color={alreadyAccepted ? colors.success : colors.primary}
          />
          <Text style={[styles.heroTitle, { color: alreadyAccepted ? colors.success : colors.primary }]}>
            {alreadyAccepted ? 'Términos aceptados ✓' : 'Política de privacidad'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            EMAI-APP • Versión {APP_VERSION}
          </Text>
        </View>

        <TermsSection icon="server-outline" title="Almacenamiento seguro">
          EMAI-APP guarda toda la información de tu institución en una base de datos segura con cifrado en tránsito y en reposo.
        </TermsSection>

        <TermsSection icon="people-outline" title="Fotos y datos de estudiantes">
          Las fotografías de rostros y nombres de los estudiantes se almacenan únicamente para que los docentes identifiquen a quién pertenece cada examen. No se usan para ningún otro propósito ni se comparten con terceros.
        </TermsSection>

        <TermsSection icon="eye-off-outline" title="Acceso restringido">
          El personal de EMAI-APP no puede ver ni acceder a la información académica de los estudiantes ni a los exámenes procesados.
        </TermsSection>

        <TermsSection icon="lock-closed-outline" title="Contraseñas">
          Las contraseñas se almacenan con hash seguro y nunca en texto plano.
        </TermsSection>

        <TermsSection icon="trash-outline" title="Derecho al olvido">
          Puedes solicitar la eliminación total de tus datos contactando al soporte de EMAI-APP.
        </TermsSection>

        {alreadyAccepted ? (
          <View style={[styles.acceptedBanner, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[{ color: colors.success, fontSize: 14, fontWeight: '600', flex: 1 }]}>
              Ya aceptaste los términos de tratamiento de datos.
            </Text>
          </View>
        ) : (
          <Button
            label="Leer y aceptar términos"
            onPress={() => setShowModal(true)}
            style={{ marginTop: 16 }}
          />
        )}

        <View style={{ marginTop: 24 }}><AppFooter /></View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.modalIconBox, { backgroundColor: `${colors.primary}12` }]}>
              <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Autorización de datos</Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              Al aceptar, autorizas a EMAI-APP a almacenar de forma segura:
            </Text>

            <View style={styles.modalList}>
              {[
                'Nombres de los estudiantes',
                'Fotografías de rostros de los estudiantes',
                'Resultados y calificaciones de exámenes',
                'Información de docentes y directivos',
              ].map((item, i) => (
                <View key={i} style={styles.modalListItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.modalListText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.modalNote, { backgroundColor: `${colors.success}0C`, borderColor: `${colors.success}25` }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.success} />
              <Text style={[styles.modalNoteText, { color: colors.success }]}>
                Solo se usan para el funcionamiento de la app. No se comparten con terceros ni se usan para publicidad.
              </Text>
            </View>

            <Button label="Acepto los términos" onPress={handleAccept} loading={loading} style={{ marginTop: 8 }} />
            <Button label="Cancelar" onPress={() => setShowModal(false)} variant="ghost" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  hero: { alignItems: 'center', padding: 24, borderRadius: 16, marginVertical: 20, gap: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800' },
  heroSubtitle: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionBody: { fontSize: 14, lineHeight: 21 },
  acceptedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingTop: 24, gap: 12 },
  modalClose: { position: 'absolute', top: 16, right: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalBody: { fontSize: 14, lineHeight: 20 },
  modalList: { gap: 10 },
  modalListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  modalListText: { flex: 1, fontSize: 14, lineHeight: 20 },
  modalNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  modalNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
