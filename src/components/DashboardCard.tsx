import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

interface DashboardCardProps {
  icon: string;
  title: string;
  description?: string;
  badge?: string | number;
  onPress: () => void;
  accentColor?: string;
  disabled?: boolean;
}

export function DashboardCard({ icon, title, description, badge, onPress, accentColor, disabled = false }: DashboardCardProps) {
  const { colors } = useTheme();
  const accent = accentColor ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled}
    >
      <View style={[styles.iconBox, { backgroundColor: `${accent}15` }]}>
        <Ionicons name={icon as any} size={26} color={accent} />
      </View>
      <View style={styles.textArea}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {description && <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{description}</Text>}
      </View>
      <View style={styles.right}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: `${accent}18` }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    borderWidth: 1, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textArea: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
