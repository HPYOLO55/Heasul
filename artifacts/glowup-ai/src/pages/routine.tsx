import React from "react";
import { Sun, Moon, CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";
import { useListAnalyses } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function RoutinePage() {
  const { data: analyses, isLoading } = useListAnalyses();
  
  if (isLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-t-2 border-primary" /></div>;
  }

  const latestResults = analyses?.[0]?.results;

  // Fallbacks if no analysis yet
  const morning = latestResults?.morning_routine || [
    "Cleanse face with gentle face wash",
    "Apply Vitamin C serum for glow",
    "Moisturize to lock in hydration",
    "Apply SPF 30+ sunscreen"
  ];

  const evening = latestResults?.evening_routine || [
    "Double cleanse to remove SPF/makeup",
    "Apply retinol or targeted treatment",
    "Use rich night cream or sleep mask",
    "Read 10 pages before sleep"
  ];

  const weekly = latestResults?.weekly_routine || [
    "Exfoliate with AHA/BHA (1-2x)",
    "Deep conditioning hair mask",
    "Meal prep for the week",
    "Active recovery / Yoga session"
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D] pb-24">
      <header className="pt-12 px-6 pb-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Your Routine</h1>
        <p className="text-muted-foreground">AI-tailored steps based on your analysis.</p>
      </header>

      <div className="px-6">
        <Tabs defaultValue="morning" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-8">
            <TabsTrigger value="morning"><Sun className="w-4 h-4 mr-2" /> AM</TabsTrigger>
            <TabsTrigger value="evening"><Moon className="w-4 h-4 mr-2" /> PM</TabsTrigger>
            <TabsTrigger value="weekly"><CalendarDays className="w-4 h-4 mr-2" /> WK</TabsTrigger>
          </TabsList>

          <TabsContent value="morning" className="space-y-4">
            {morning.map((step, idx) => (
              <RoutineStep key={idx} num={idx + 1} title={step} />
            ))}
          </TabsContent>
          
          <TabsContent value="evening" className="space-y-4">
            {evening.map((step, idx) => (
              <RoutineStep key={idx} num={idx + 1} title={step} />
            ))}
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4">
            {weekly.map((step, idx) => (
              <RoutineStep key={idx} num={idx + 1} title={step} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RoutineStep({ num, title }: { num: number, title: string }) {
  const [done, setDone] = React.useState(false);
  
  return (
    <Card 
      className={`p-4 border border-white/5 transition-all cursor-pointer select-none flex items-center gap-4 ${done ? 'bg-primary/5 opacity-60' : 'bg-white/5 hover:bg-white/10'}`}
      onClick={() => setDone(!done)}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm transition-colors ${done ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : num}
      </div>
      <p className={`flex-1 text-sm font-medium ${done ? 'line-through text-white/50' : 'text-white'}`}>
        {title}
      </p>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </Card>
  );
}