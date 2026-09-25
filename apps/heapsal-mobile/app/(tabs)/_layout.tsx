import { Tabs } from "expo-router";
import { Camera, Home, Scissors, Shirt, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

const GOLD = "#F5C542";
const MUTED = "#8F8F8F";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.bar, tabBarActiveTintColor: GOLD, tabBarInactiveTintColor: MUTED }}>
      <Tabs.Screen name="dashboard" options={{ tabBarIcon: ({ color }) => <Home color={color} size={23} /> }} />
      <Tabs.Screen name="closet" options={{ tabBarIcon: ({ color }) => <Shirt color={color} size={23} /> }} />
      <Tabs.Screen name="camera" options={{ tabBarIcon: () => <View style={styles.camera}><Camera color="#17130A" size={25} fill="#17130A" /></View> }} />
      <Tabs.Screen name="hairstyle" options={{ tabBarIcon: ({ color }) => <Scissors color={color} size={23} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color }) => <User color={color} size={23} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", height: 82, paddingTop: 10, paddingBottom: 18, backgroundColor: "#171717", borderTopColor: "rgba(255,255,255,.08)", borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  camera: { width: 58, height: 58, borderRadius: 29, marginTop: -28, alignItems: "center", justifyContent: "center", backgroundColor: "#F5C542", shadowColor: "#F5C542", shadowOpacity: .4, shadowRadius: 12, elevation: 8 }
});
