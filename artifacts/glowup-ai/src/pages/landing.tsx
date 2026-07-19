import React from "react";
import { Link } from "wouter";
import { Sparkles, ArrowRight, Camera, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D] text-white overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Header */}
      <header className="flex items-center justify-between p-6 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-xl tracking-tight">Heapsal</span>
        </div>
        <Link href="/sign-in">
          <Button variant="ghost" className="text-sm font-medium">Log In</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 pt-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md w-full flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Your VIP backstage pass to your best self</span>
          </div>

          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Unlock Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#F7D87C] to-primary">True Potential</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            Upload a photo for a world-class AI analysis of your skin, style, and aesthetics. Build habits that transform you.
          </p>

          <div className="w-full flex flex-col gap-4">
            <Link href="/sign-up" className="w-full">
              <Button size="lg" className="w-full text-lg group h-14">
                Start Your Heapsal
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/60">Takes less than 2 minutes. Free to start.</p>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 mt-20 w-full max-w-md"
        >
          <FeatureCard 
            icon={Camera} 
            title="AI Aesthetic Analysis" 
            description="Deep analysis of skin, hair, facial structure & style."
          />
          <FeatureCard 
            icon={Shield} 
            title="Daily Wellness Routine" 
            description="Personalized actionable steps based on your results."
          />
          <FeatureCard 
            icon={Trophy} 
            title="Gamified Transformation" 
            description="Track streaks, earn XP, and unlock achievements."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-[20px] bg-white/5 border border-white/5 backdrop-blur-sm text-left">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1 font-display">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}