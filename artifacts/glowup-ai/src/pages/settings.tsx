import React from "react";
import { ArrowLeft, Bell, Shield, Smartphone, FileText, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] min-h-screen">
      <header className="sticky top-0 z-50 glass-nav h-16 px-4 flex items-center justify-between">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <span className="font-display font-semibold text-white">Settings</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-10 space-y-6">
        
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-2">Preferences</h2>
          <Card className="divide-y divide-white/5 border-white/5 bg-white/5">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">Push Notifications</div>
                  <div className="text-xs text-muted-foreground">Daily reminders & updates</div>
                </div>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="p-4 flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-white">Haptic Feedback</div>
                  <div className="text-xs text-muted-foreground">Vibrate on actions</div>
                </div>
              </div>
              <div className="w-10 h-6 bg-white/20 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-2">Privacy & Security</h2>
          <Card className="divide-y divide-white/5 border-white/5 bg-white/5">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-white">Data Processing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-white">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </section>
        
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-2">About</h2>
          <Card className="divide-y divide-white/5 border-white/5 bg-white/5">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-white">Terms of Service</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-white">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </section>

        <div className="pt-8 text-center">
          <p className="text-xs text-muted-foreground mb-1">Heapsal v1.0.0</p>
          <p className="text-[10px] text-muted-foreground/50">Made for your transformation</p>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}