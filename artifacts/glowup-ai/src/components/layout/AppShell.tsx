import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Camera, LineChart, CheckSquare, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const isPublicRoute = location === "/" || location.startsWith("/sign-in") || location.startsWith("/sign-up");

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-transparent">
      {/* 430px centered shell */}
      <div className="w-full max-w-[430px] min-h-[100dvh] flex flex-col relative bg-[#0D0D0D] shadow-2xl overflow-x-hidden">
        {/* Main Content Area */}
        <main className={cn(
          "flex-1 flex flex-col w-full h-full pb-20 relative z-0",
          isPublicRoute && "pb-0" // No bottom nav padding on public routes
        )}>
          {children}
        </main>

        {/* Bottom Navigation */}
        {!isPublicRoute && (
          <nav className="fixed bottom-0 w-full max-w-[430px] glass-nav h-20 px-6 pb-safe flex items-center justify-between z-50 rounded-t-3xl">
            <NavItem href="/dashboard" icon={Home} label="Home" active={location === "/dashboard"} />
            <NavItem href="/routine" icon={CheckSquare} label="Routine" active={location === "/routine"} />
            
            {/* Center Camera Button */}
            <div className="relative -top-5">
              <Link href="/camera">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(245,197,66,0.4)] cursor-pointer text-primary-foreground"
                >
                  <Camera className="w-6 h-6 fill-current" />
                </motion.div>
              </Link>
            </div>

            <NavItem href="/progress" icon={LineChart} label="Progress" active={location === "/progress"} />
            <NavItem href="/profile" icon={User} label="Profile" active={location === "/profile"} />
          </nav>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link href={href} className="relative flex flex-col items-center justify-center w-12 h-12">
      <Icon className={cn("w-6 h-6 transition-colors duration-300", active ? "text-primary" : "text-muted-foreground")} />
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}
