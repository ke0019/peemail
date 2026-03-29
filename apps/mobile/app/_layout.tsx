// 必须最先 import，为 @noble/hashes 等 Web Crypto 依赖提供 polyfill
import 'react-native-get-random-values';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Peemail' }} />
    </Stack>
  );
}
