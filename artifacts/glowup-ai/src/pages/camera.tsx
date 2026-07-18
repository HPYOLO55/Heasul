import React, { useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera as CameraIcon, Upload, X, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateAnalysis } from "@workspace/api-client-react";

export default function CameraPage() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const createAnalysis = useCreateAnalysis();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleAnalyze = async () => {
    if (!previewUrl) return;
    
    try {
      const compressedDataUrl = await compressImage(previewUrl);
      createAnalysis.mutate({ data: { photoDataUrl: compressedDataUrl } }, {
        onSuccess: (data) => {
          setLocation(`/report/${data.id}`);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const isAnalyzing = createAnalysis.isPending;

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-black relative">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="user" 
        className="hidden" 
        ref={cameraInputRef} 
        onChange={handleFileSelect} 
      />

      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50">
        <Button variant="ghost" size="icon" className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white" onClick={() => setLocation("/dashboard")}>
          <X className="w-5 h-5" />
        </Button>
        <span className="font-display font-bold text-white tracking-widest text-sm uppercase">ANALYSIS</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full max-h-[70vh] rounded-[30px] overflow-hidden relative border border-white/20 shadow-2xl"
            >
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary animate-ping opacity-20" />
                  </div>
                  <p className="text-primary font-display font-medium mt-4 tracking-widest uppercase text-sm animate-pulse">
                    Analyzing Aesthetics...
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full max-h-[60vh] border-2 border-dashed border-white/20 rounded-[30px] flex flex-col items-center justify-center p-8 text-center bg-white/5 backdrop-blur-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl relative">
                <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-20" />
                <CameraIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Upload a Photo</h2>
              <p className="text-muted-foreground text-sm mb-10 max-w-[250px]">
                Face straight, good lighting, no glasses for best analysis results.
              </p>
              
              <div className="flex flex-col w-full gap-4 relative z-10">
                <Button size="lg" className="w-full h-14 text-base" onClick={() => cameraInputRef.current?.click()}>
                  <CameraIcon className="w-5 h-5 mr-2" /> Take Photo
                </Button>
                <Button variant="outline" size="lg" className="w-full h-14 text-base bg-black/50" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5 mr-2" /> Choose from Library
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewUrl && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="p-6 pb-12 pt-0"
          >
            <Button size="lg" className="w-full h-16 text-lg tracking-wide uppercase font-bold" onClick={handleAnalyze}>
              <Zap className="w-5 h-5 mr-2" /> Analyze My Glow
            </Button>
            <Button variant="ghost" className="w-full mt-4 text-muted-foreground" onClick={() => setPreviewUrl(null)}>
              Retake Photo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}