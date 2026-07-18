import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format, parseISO } from "date-fns";
import { Camera, Image as ImageIcon, Plus } from "lucide-react";
import { useGetProgress, useListProgressPhotos, useCreateProgressPhoto } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function ProgressPage() {
  const { data: progressData, isLoading: progressLoading } = useGetProgress();
  const { data: photos, isLoading: photosLoading } = useListProgressPhotos();
  const createPhoto = useCreateProgressPhoto();
  
  const [timeRange, setTimeRange] = useState("30"); // days
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (progressLoading || photosLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-t-2 border-primary" /></div>;
  }

  const scoreData = progressData?.glowScoreHistory || [];
  
  // Fake empty states if no data
  const chartData = scoreData.length > 0 ? scoreData.map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    score: d.score
  })) : [
    { date: 'Mon', score: 40 }, { date: 'Tue', score: 45 }, { date: 'Wed', score: 55 }, { date: 'Thu', score: 62 }, { date: 'Fri', score: 70 }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        createPhoto.mutate({ data: { photoDataUrl: dataUrl, note: "Progress update" }});
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D] pb-24">
      <header className="pt-12 px-6 pb-4">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Your Progress</h1>
        <p className="text-muted-foreground">Watch your transformation unfold.</p>
      </header>

      <div className="px-6 space-y-8">
        {/* Chart Section */}
        <section>
          <Tabs defaultValue="30" onValueChange={setTimeRange} className="w-full mb-4">
            <TabsList className="w-full grid grid-cols-4 bg-white/5">
              <TabsTrigger value="7">7D</TabsTrigger>
              <TabsTrigger value="30">30D</TabsTrigger>
              <TabsTrigger value="90">90D</TabsTrigger>
              <TabsTrigger value="all">ALL</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="p-5 border-white/5 bg-[#121212] relative overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Glow Score Trend</h3>
            <div className="h-[200px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} dy={10} />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#F5C542' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* Photos Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Progress Photos</h2>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
            <Button variant="ghost" size="sm" className="h-8 text-primary px-2" onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {photos && photos.length > 0 ? photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                <img src={photo.photoUrl} alt="Progress" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-medium text-white">{format(parseISO(photo.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            )) : (
              <Card className="col-span-2 p-8 border-dashed border-white/20 bg-white/5 flex flex-col items-center text-center justify-center aspect-video">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No progress photos yet. Upload your first to start tracking.</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Upload Photo
                </Button>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}