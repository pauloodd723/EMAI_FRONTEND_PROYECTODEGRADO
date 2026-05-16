import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Image,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

// ─── BUTTON ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label, onPress, variant = 'primary', loading = false,
  disabled = false, style, fullWidth = true,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      height: 52, borderRadius: 12, alignItems: 'center',
      justifyContent: 'center', paddingHorizontal: 24,
      width: fullWidth ? '100%' : undefined,
    };
    switch (variant) {
      case 'primary':  return { ...base, backgroundColor: disabled ? colors.textMuted : colors.primary };
      case 'outline':  return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'ghost':    return { ...base, backgroundColor: 'transparent' };
      case 'danger':   return { ...base, backgroundColor: colors.error };
    }
  };

  const getLabelStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'danger':  return { color: '#FFFFFF', fontWeight: '600', fontSize: 16 };
      case 'outline': return { color: colors.primary, fontWeight: '600', fontSize: 16 };
      case 'ghost':   return { color: colors.textSecondary, fontWeight: '500', fontSize: 15 };
    }
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} onPress={onPress}
      disabled={disabled || loading} activeOpacity={0.8}>
      {loading
        ? <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFF'} />
        : <Text style={getLabelStyle()}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, containerStyle, leftIcon, rightIcon, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center', height: 52,
        borderRadius: 12, borderWidth: 1.5,
        borderColor: error ? colors.error : focused ? colors.primary : colors.border,
        backgroundColor: colors.surface, paddingHorizontal: 14,
      }}>
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
        <TextInput
          style={[{ flex: 1, fontSize: 16, color: colors.textPrimary, padding: 0 }, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
      </View>
      {error && <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding = 16 }: CardProps) {
  const { colors } = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface, borderRadius: 16, padding,
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  };
  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  onPress?: () => void;
}

export function Avatar({ name, photoUrl, size = 44, onPress }: AvatarProps) {
  const { colors } = useTheme();

  const safeName = name || '?';
  const initials = safeName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const content = photoUrl ? (
    <Image
      source={{ uri: photoUrl }}
      style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: colors.primary,
      }}
    />
  ) : (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#FFF', fontSize: size * 0.35, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const { colors } = useTheme();
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: '#E8F5EE', text: '#1E8C4E' };
      case 'error':   return { bg: '#FDECEA', text: '#D93025' };
      case 'warning': return { bg: '#FEF7E8', text: '#B45309' };
      case 'info':    return { bg: '#EEF4FF', text: '#3B5BDB' };
      default:        return { bg: colors.borderLight, text: colors.textSecondary };
    }
  };
  const { bg, text } = getColors();
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: text }}>{label}</Text>
    </View>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  const { colors } = useTheme();
  if (!label) return <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 16 }} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ marginHorizontal: 12, fontSize: 12, color: colors.textMuted, fontWeight: '500' }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

// ─── APP FOOTER ───────────────────────────────────────────────────────────────
export function AppFooter() {
  const { colors } = useTheme();
  return (
    <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>
      EMAI-APP v1.0.0
    </Text>
  );
}
