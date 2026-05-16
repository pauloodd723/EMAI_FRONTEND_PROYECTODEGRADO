import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function RouteGuard() {
  const { isAuthenticated, isLoading, user, institution } = useAuth();
  const { setInstitutionColors, resetColors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  // Aplicar colores de institución SOLO para directivo y docente
  useEffect(() => {
    if (user?.role === 'directivo' || user?.role === 'docente') {
      if (institution?.primaryColor) {
        setInstitutionColors(institution.primaryColor, institution.secondaryColor);
      }
    } else {
      // Admin y sin sesión usan colores por defecto
      resetColors();
    }
  }, [user?.role, institution?.primaryColor]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      switch (user?.role) {
        case 'admin':      router.replace('/(admin)');     break;
        case 'directivo':  router.replace('/(directivo)'); break;
        case 'docente':    router.replace('/(docente)');   break;
        default:           router.replace('/auth/login');  break;
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RouteGuard />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(directivo)" />
              <Stack.Screen name="(docente)" />
              <Stack.Screen name="(shared)" />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
