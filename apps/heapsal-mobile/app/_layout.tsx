import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-expo";
import { Stack, Redirect, useSegments } from "expo-router";
import { tokenCache } from "../src/auth/token-cache";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!publishableKey) {
    return <View style={styles.center}><ActivityIndicator color="#F5C542" /></View>;
  }
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><AuthNavigator /></ClerkProvider>;
}

function AuthNavigator() {
  const segments = useSegments();
  const inAuth = segments[0] === "auth";
  return <>
    <SignedIn><Stack screenOptions={{ headerShown: false }} /></SignedIn>
    <SignedOut>{inAuth ? <Stack screenOptions={{ headerShown: false }} /> : <Redirect href="/auth/sign-in" />}</SignedOut>
  </>;
}

export function SignInScreen() { return <SignIn />; }
export function SignUpScreen() { return <SignUp />; }
const styles = StyleSheet.create({ center: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" } });
