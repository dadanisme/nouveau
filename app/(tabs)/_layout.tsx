import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Label>Transactions</Label>
        <Icon
          sf="arrow.left.arrow.right"
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="swap-horizontal" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard">
        <Label>Dashboard</Label>
        <Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="view-dashboard" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
