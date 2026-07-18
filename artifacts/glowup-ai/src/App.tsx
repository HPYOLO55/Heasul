import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import CameraPage from "@/pages/camera";
import ReportPage from "@/pages/report";
import ProgressPage from "@/pages/progress";
import RoutinePage from "@/pages/routine";
import MissionsPage from "@/pages/missions";
import AchievementsPage from "@/pages/achievements";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#F5C542",
    colorBackground: "#0D0D0D",
    colorInput: "#171717",
    colorInputForeground: "#FFFFFF",
    colorForeground: "#FFFFFF",
    colorMutedForeground: "#9CA3AF",
    colorNeutral: "#374151",
    colorDanger: "#EF4444",
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
    borderRadius: "20px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#171717] rounded-[20px] w-[440px] max-w-full overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-display font-bold text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-white/80",
    footerActionLink: "text-primary hover:text-primary/80 font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-full",
    formFieldInput: "bg-[#1a1a1a] border-white/10 text-white rounded-xl focus:border-primary/50 focus:ring-primary/50",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0D0D0D] px-4 w-full relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-[#0D0D0D] pointer-events-none" />
      <div className="relative z-10 w-full max-w-[440px]">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0D0D0D] px-4 w-full relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-[#0D0D0D] pointer-events-none" />
      <div className="relative z-10 w-full max-w-[440px]">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppShell>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Protected Routes */}
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/camera"><ProtectedRoute component={CameraPage} /></Route>
            <Route path="/report/:id"><ProtectedRoute component={ReportPage} /></Route>
            <Route path="/progress"><ProtectedRoute component={ProgressPage} /></Route>
            <Route path="/routine"><ProtectedRoute component={RoutinePage} /></Route>
            <Route path="/missions"><ProtectedRoute component={MissionsPage} /></Route>
            <Route path="/achievements"><ProtectedRoute component={AchievementsPage} /></Route>
            <Route path="/profile"><ProtectedRoute component={ProfilePage} /></Route>
            <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
            
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
