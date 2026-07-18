import React from "react";
import { useParams, Link } from "wouter";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Sparkles, AlertTriangle, Clock, CheckCircle2, ChevronRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function ReportPage() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: analysis, isLoading, error } = useGetAnalysis(id, { 
    query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D0D] min-h-screen">
        <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin mb-4" />
        <p className="text-primary font-display font-medium tracking-widest uppercase text-sm animate-pulse">Loading Analysis</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0D0D0D] min-h-screen">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-display font-bold text-white mb-2">Analysis Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't load this report.</p>
        <Link href="/dashboard"><Button>Return Home</Button></Link>
      </div>
    );
  }

  const results = analysis.results;
  if (!results) return null;

  const categories = [
    { key: 'skin_analysis', label: 'Skin Health', data: results.skin_analysis },
    { key: 'hair_analysis', label: 'Hair Care', data: results.hair_analysis },
    { key: 'eyes_analysis', label: 'Eye Area', data: results.eyes_analysis },
    { key: 'smile_analysis', label: 'Smile & Teeth', data: results.smile_analysis },
    { key: 'face_shape', label: 'Facial Structure', data: results.face_shape },
    { key: 'posture', label: 'Posture', data: results.posture },
  ].filter(c => c.data && c.data.condition);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav h-16 px-4 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <span className="font-display font-semibold text-white">Analysis Report</span>
        <div className="w-10" />
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-4 pt-6"
      >
        {/* Hero Score Section */}
        <motion.div variants={itemVariants} className="mb-10 flex flex-col items-center text-center">
          <div className="relative w-40 h-40 mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="76" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
              <circle 
                cx="80" cy="80" r="76" 
                stroke="var(--color-primary)" 
                strokeWidth="6" fill="none" 
                className="transition-all duration-1500 ease-out drop-shadow-[0_0_10px_rgba(245,197,66,0.5)]" 
                strokeDasharray={2 * Math.PI * 76} 
                strokeDashoffset={2 * Math.PI * 76 * (1 - (results.overall_glow_score || 0) / 100)} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-display font-bold text-white">{results.overall_glow_score}</span>
              <span className="text-xs font-bold text-primary tracking-widest uppercase mt-1">Glow Score</span>
            </div>
          </div>
          
          <div className="flex gap-2 mb-2">
            <Badge variant="glass" className="px-3 py-1.5 text-sm"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary"/> Style: {results.style_score || 0}</Badge>
            <Badge variant="glass" className="px-3 py-1.5 text-sm"><Target className="w-3.5 h-3.5 mr-1.5 text-primary"/> Confidence: {results.confidence_score || 0}</Badge>
          </div>
        </motion.div>

        {/* Top Strengths & Weaknesses */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 mb-10">
          <Card className="p-5 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Top Strengths
            </h3>
            <ul className="space-y-3">
              {results.top_strengths?.map((strength, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
          
          <Card className="p-5 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-destructive" /> Priority Improvements
            </h3>
            <ul className="space-y-3">
              {results.priority_improvements?.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <ChevronRight className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Detailed Category Analysis */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-display font-bold text-white mb-6 pl-2">Detailed Breakdown</h2>
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <CategoryCard key={idx} title={cat.label} data={cat.data} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CategoryCard({ title, data }: { title: string, data: any }) {
  if (!data) return null;
  
  const score = data.score || 0;
  
  return (
    <Card className="overflow-hidden border-white/10 group">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-white">{title}</h3>
          <span className="text-lg font-bold font-display text-primary">{score}<span className="text-xs text-muted-foreground">/100</span></span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
      
      <div className="p-5 bg-black/20 space-y-4">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Analysis</span>
          <p className="text-sm text-foreground/90 leading-relaxed">{data.condition}</p>
        </div>
        
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Action Plan</span>
          <p className="text-sm text-primary/90 leading-relaxed">{data.tips}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {data.difficulty && (
            <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
              Difficulty: <span className="text-white ml-1">{data.difficulty}</span>
            </Badge>
          )}
          {data.estimated_time && (
            <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
              <Clock className="w-3 h-3 mr-1" /> {data.estimated_time}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}