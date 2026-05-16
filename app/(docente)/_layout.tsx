import { Stack } from 'expo-router';

export default function DocenteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cursos" />
      <Stack.Screen name="estudiante" />
      <Stack.Screen name="crear-examen" />
      <Stack.Screen name="escanear" />
      <Stack.Screen name="revision-examen" />
      <Stack.Screen name="reportes" />
    </Stack>
  );
}
