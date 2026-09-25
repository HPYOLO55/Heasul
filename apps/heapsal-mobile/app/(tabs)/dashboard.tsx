import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import DashboardScreen from "./dashboard";

export default function DashboardRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color="#F5C542" /></View>;
  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;
  return <DashboardScreen />;
}
const styles = StyleSheet.create({ center: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" } });
