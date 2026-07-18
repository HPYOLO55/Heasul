import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Sparkles, Flame, Droplets, Moon, ArrowRight, CheckCircle2, ChevronRight, Award, Camera } from "lucide-react";
import { useGetDashboard, useUpsertTodayLog, useGetTodayMissions, useCompleteMission } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading } = useGetDashboard();
  const { data: missions } = useGetTodayMissions();
  const upsertLog = useUpsertTodayLog();
  const completeMission = useCompleteMission();

  const handleWaterAdd = (amount: number) => {
    upsertLog.mutate({ data: { waterMl: (dashboard?.waterMlToday || 0) + amount } });
  };

  const handleSleepLog = (hours: number) => {
    upsertLog.mutate({ data: { sleepHours: hours } });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div>
      </div>
    );
  }

  const overallScore = dashboard?.glowScore || 0;
  const firstName = user?.firstName || "Beautiful";
  const uncompletedMissions = missions?.filter(m => !m.completed) || [];

  return (
    <div className="flex-1 overflow-y-auto pt-8 px-6 pb-6 scroll-smooth">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-white mb-1">Good Morning, {firstName}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              Level {dashboard?.level || 1} <span className="w-1 h-1 rounded-full bg-white/30" /> 
              {dashboard?.totalXp || 0} XP
            </p>
          </div>
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-white/5 shrink-0 relative cursor-pointer">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-display text-primary">
                  {firstName.charAt(0)}
                </div>
              )}
            </div>
          </Link>
        </header>

        {/* Hero Score Card */}
        <Card className="mb-6 relative overflow-hidden bg-gradient-to-br from-[#1c1a17] to-[#121212] border-primary/20">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-primary mb-1 tracking-wide uppercase">OVERALL GLOW</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold text-white">{overallScore}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="glass" className="flex gap-1.5 py-1 px-3">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{dashboard?.streak || 0} Day Streak</span>
                </Badge>
              </div>
            </div>
            
            {/* Circular Progress visualization could go here, for now using a subtle glowing badge */}
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary/10" />
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="4" fill="none" 
                        className="text-primary transition-all duration-1000 ease-out" 
                        strokeDasharray={2 * Math.PI * 38} 
                        strokeDashoffset={2 * Math.PI * 38 * (1 - overallScore / 100)} />
              </svg>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          {!dashboard?.recentAnalysis && (
            <div className="px-6 pb-6 pt-2">
              <Button onClick={() => setLocation("/camera")} className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-none">
                <Camera className="w-4 h-4 mr-2" /> Start First Analysis
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Water Log */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white">Water</span>
            </div>
            <div className="text-xl font-display font-semibold mb-3">
              {dashboard?.waterMlToday || 0}<span className="text-xs text-muted-foreground ml-1">ml</span>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="sm" className="h-8 flex-1 text-xs" onClick={() => handleWaterAdd(250)}>+250</Button>
              <Button variant="glass" size="sm" className="h-8 flex-1 text-xs" onClick={() => handleWaterAdd(500)}>+500</Button>
            </div>
          </Card>

          {/* Sleep Log */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-white">Sleep</span>
            </div>
            <div className="text-xl font-display font-semibold mb-3">
              {dashboard?.sleepHoursLast || 0}<span className="text-xs text-muted-foreground ml-1">hrs</span>
            </div>
            <Button variant="glass" size="sm" className="h-8 w-full text-xs" onClick={() => handleSleepLog(8)}>Log 8h</Button>
          </Card>
        </div>

        {/* Today's Missions Preview */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white">Today's Missions</h2>
          <Link href="/missions">
            <span className="text-xs font-medium text-primary flex items-center">View All <ChevronRight className="w-3 h-3 ml-0.5"/></span>
          </Link>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {uncompletedMissions.slice(0, 2).map((mission, i) => (
            <motion.div 
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-4 flex items-center justify-between border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary/70" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-0.5">{mission.missionText}</h4>
                    <span className="text-xs text-primary font-medium">+{mission.xpReward} XP</span>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-10 h-10 rounded-full shrink-0 border border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50"
                  onClick={() => completeMission.mutate({ id: mission.id })}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              </Card>
            </motion.div>
          ))}
          {uncompletedMissions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-white/5 rounded-2xl border border-white/5">
              All caught up for today. Great job!
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}