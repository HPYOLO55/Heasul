import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { useGetTodayMissions, useCompleteMission, useGetDashboard } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function MissionsPage() {
  const { data: missions, isLoading } = useGetTodayMissions();
  const { data: dashboard } = useGetDashboard();
  const completeMission = useCompleteMission();

  if (isLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-t-2 border-primary" /></div>;
  }

  const completedCount = missions?.filter(m => m.completed).length || 0;
  const totalCount = missions?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D] pb-24">
      <header className="pt-12 px-6 pb-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          Daily Missions <Zap className="w-6 h-6 text-primary fill-primary/20" />
        </h1>
        <p className="text-muted-foreground mb-8">Complete missions to earn XP and level up.</p>

        <Card className="p-5 border-white/10 bg-white/5">
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Today's Progress</div>
              <div className="text-2xl font-display font-bold text-white">{completedCount} <span className="text-muted-foreground text-lg">/ {totalCount}</span></div>
            </div>
            <div className="text-primary font-bold text-sm">Level {dashboard?.level || 1}</div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </Card>
      </header>

      <div className="px-6 flex flex-col gap-4">
        <AnimatePresence>
          {missions?.map((mission) => (
            <motion.div 
              key={mission.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`p-4 transition-all duration-300 ${mission.completed ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`font-medium text-sm mb-1 ${mission.completed ? 'text-white/70 line-through' : 'text-white'}`}>
                      {mission.missionText}
                    </h3>
                    <span className="text-xs text-primary font-medium tracking-wide uppercase">+{mission.xpReward} XP</span>
                  </div>
                  
                  {mission.completed ? (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="shrink-0 h-10 border-white/10 text-xs hover:bg-primary/20 hover:text-primary hover:border-primary/50"
                      onClick={() => completeMission.mutate({ id: mission.id })}
                      disabled={completeMission.isPending}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}