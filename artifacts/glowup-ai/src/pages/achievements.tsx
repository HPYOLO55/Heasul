import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, Star, CheckCircle, Lock } from "lucide-react";
import { useListAchievements, useGetDashboard } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AchievementsPage() {
  const { data: achievementsData, isLoading } = useListAchievements();
  const { data: dashboard } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  const unlocked = achievementsData?.unlocked || [];
  const locked = achievementsData?.locked || [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D] pb-24">
      <header className="pt-12 px-6 pb-6 bg-gradient-to-b from-primary/10 to-transparent">
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          Achievements <Trophy className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground">Unlock your potential, earn your rewards.</p>
        
        <div className="mt-8 flex items-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mr-4">
            <span className="text-xl font-display font-bold text-primary">{dashboard?.level || 1}</span>
          </div>
          <div>
            <div className="text-sm font-medium text-white mb-1">Level {dashboard?.level || 1}</div>
            <div className="text-xs text-primary font-medium">{dashboard?.totalXp || 0} Total XP</div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-8">
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Unlocked ({unlocked.length})</h2>
          <div className="grid grid-cols-2 gap-4">
            {unlocked.map((ach) => (
              <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-4 h-full border-primary/30 bg-primary/5 flex flex-col items-center text-center group hover:bg-primary/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(245,197,66,0.3)]">
                    <Star className="w-6 h-6 text-primary fill-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-white text-sm mb-1">{ach.label}</h3>
                  <p className="text-xs text-muted-foreground mt-auto">{ach.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            Locked <Lock className="w-3 h-3" />
          </h2>
          <div className="grid grid-cols-2 gap-4 opacity-60">
            {locked.map((ach, i) => (
              <Card key={i} className="p-4 h-full border-white/5 bg-white/5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 grayscale">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-display font-medium text-muted-foreground text-sm mb-1">{ach.label}</h3>
                <p className="text-[10px] text-muted-foreground/60 mt-auto">{ach.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}