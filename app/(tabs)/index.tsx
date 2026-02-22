import { Button, Text, View } from 'react-native';

import { useAuth } from '@/store';

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hello World - Home</Text>
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}
