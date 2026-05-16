import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Avatar } from '@/src/components/ui';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  extraMenuItems?: MenuItem[];
}

export function TopBar({ title, showBack, onBack, extraMenuItems = [] }: TopBarProps) {
  const router = useRouter();
  const { user, institution, logout } = useAuth();
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayTitle = title ?? institution?.name ?? 'EMAI-APP';
  const userName = user?.fullName ?? user?.username ?? '';

  const defaultItems: MenuItem[] = [
    {
      icon: 'create-outline',
      label: 'Editar perfil',
      onPress: () => { setMenuOpen(false); router.push('/(shared)/perfil/editar'); },
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: 'Contactar soporte',
      onPress: () => { setMenuOpen(false); router.push('/(shared)/soporte'); },
    },
    {
      icon: 'log-out-outline',
      label: 'Cerrar sesión',
      danger: true,
      onPress: async () => { setMenuOpen(false); await logout(); },
    },
  ];

  const allItems = [...extraMenuItems, ...defaultItems];

  return (
    <>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity onPress={onBack ?? (() => router.back())} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.logoMini, { backgroundColor: colors.primary }]}>
              <Ionicons name="school-outline" size={14} color="#FFF" />
            </View>
          )}
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{displayTitle}</Text>
        </View>
        <Avatar name={userName} photoUrl={user?.photoUrl ?? undefined} size={38} onPress={() => setMenuOpen(true)} />
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.menuHeader, { borderBottomColor: colors.borderLight }]}>
              <Avatar name={userName} photoUrl={user?.photoUrl ?? undefined} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuName, { color: colors.textPrimary }]} numberOfLines={1}>{userName}</Text>
                <Text style={[styles.menuRole, { color: colors.textSecondary }]}>{getRoleLabel(user?.role, user?.subRole)}</Text>
              </View>
            </View>
            {allItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i === allItems.length - 1 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon as any} size={18} color={item.danger ? colors.error : colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: item.danger ? colors.error : colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function getRoleLabel(role?: string, subRole?: string): string {
  if (role === 'admin') return 'Administrador';
  if (role === 'docente') return 'Docente';
  if (subRole) {
    const map: Record<string, string> = { director: 'Director', subdirector: 'Subdirector', coordinador: 'Coordinador', psicologo: 'Psicólogo', otro: 'Directivo' };
    return map[subRole] ?? 'Directivo';
  }
  return 'Directivo';
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 12, borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  logoMini: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: Platform.OS === 'ios' ? 100 : 70, paddingRight: 16 },
  menu: { width: 260, borderRadius: 16, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  menuName: { fontSize: 15, fontWeight: '700' },
  menuRole: { fontSize: 12, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemText: { fontSize: 15 },
});
