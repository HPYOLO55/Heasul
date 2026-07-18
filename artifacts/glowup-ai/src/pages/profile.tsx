import React from "react";
import { Link } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useGetMe, useGetDashboard } from "@workspace/api-client-react";
import { LogOut, Settings, Trophy, Target, Heart, ChevronRight, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: profile, isLoading: profileLoading } = useGetMe();
  const { data: dashboard, isLoading: dashLoading } = useGetDashboard();

  if (profileLoading || dashLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-t-2 border-primary" /></div>;
  }

  const overallScore = dashboard?.glowScore || 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D] pb-24">
      {/* Header Profile Section */}
      <div className="relative pt-16 pb-8 px-6 flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        <div className="w-28 h-28 rounded-full border-4 border-[#0D0D0D] bg-[#1a1a1a] shadow-[0_0_0_2px_rgba(245,197,66,0.3)] overflow-hidden mb-4 relative z-10">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-primary">
              {user?.firstName?.charAt(0)}
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-display font-bold text-white mb-1 relative z-10">{user?.fullName || 'VIP Member'}</h1>
        <p className="text-muted-foreground text-sm relative z-10">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Stats Strip */}
        <Card className="p-5 flex items-center justify-between border-white/5 bg-white/5">
          <div className="flex flex-col items-center">
            <span className="text-xl font-display font-bold text-white">{overallScore}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Glow Score</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-display font-bold text-white">{dashboard?.streak || 0}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Day Streak</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-display font-bold text-primary">Lv.{dashboard?.level || 1}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Level</span>
          </div>
        </Card>

        {/* Level Progress */}
        <div className="px-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-white">Experience</span>
            <span className="text-xs text-primary font-bold">{dashboard?.totalXp || 0} XP</span>
          </div>
          <Progress value={((dashboard?.totalXp || 0) % 1000) / 10} className="h-1.5" />
        </div>

        {/* Menu Links */}
        <div className="flex flex-col gap-3 mt-8">
          <Link href="/achievements">
            <Card className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors border-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-white text-sm">Achievements</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors border-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white/70" />
                </div>
                <span className="font-medium text-white text-sm">Settings & Privacy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-16 mt-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}