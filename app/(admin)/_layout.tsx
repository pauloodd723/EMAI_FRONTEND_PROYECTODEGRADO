import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tokens" />
      <Stack.Screen name="admins" />
      <Stack.Screen name="soporte" />
    </Stack>
  );
}
