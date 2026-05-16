import { Stack } from 'expo-router';

export default function DirectivoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="institucion" />
      <Stack.Screen name="cursos" />
      <Stack.Screen name="materias" />
      <Stack.Screen name="supervision" />
      <Stack.Screen name="terminos" />
      <Stack.Screen name="usuarios/directivos" />
      <Stack.Screen name="usuarios/docentes" />
      <Stack.Screen name="usuarios/lista" />
    </Stack>
  );
}
