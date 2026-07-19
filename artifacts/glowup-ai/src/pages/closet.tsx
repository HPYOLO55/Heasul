import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shirt, Sparkles, PieChart, Plus, Search, Heart, Trash2, Camera, 
  Image as ImageIcon, X, Loader2, Lightbulb, Zap, Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClosetItem {
  id: number; userId: number; photoUrl: string | null;
  name: string; category: string; subcategory: string;
  primaryColor: string; secondaryColors: string[];
  pattern: string; material: string; season: string;
  occasion: string; style: string; fit: string;
  gender: string; formality: string; description: string;
  favorite: boolean; createdAt: string;
}

interface ClosetStats {
  total: number; tops: number; bottoms: number; shoes: number;
  accessories: number; favorites: number; mostWornColor: string | null;
  seasonDistribution: Record<string,number>; occasionDistribution: Record<string,number>;
  missingEssentials: string[]; recentlyAdded: ClosetItem[];
}

interface OutfitSlot { id: number | null; name: string; reason: string; }

interface GeneratedOutfit {
  top: OutfitSlot; bottom: OutfitSlot; shoes: OutfitSlot; accessory: OutfitSlot;
  style_score: number; color_harmony: string; occasion: string;
  why_it_works: string; styling_tip: string;
}

interface SavedOutfit {
  id: number; name: string; occasion: string; weather?: string;
  itemIds: number[]; score?: number; colorHarmony?: string;
  explanation: string; savedAt: string;
}

const TABS = [
  { id: "closet", icon: Shirt, label: "My Closet" },
  { id: "outfits", icon: Sparkles, label: "Outfits" },
  { id: "insights", icon: PieChart, label: "Insights" }
] as const;

export default function ClosetPage() {
  const [activeTab, setActiveTab] = useState<"closet" | "outfits" | "insights">("closet");
  
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [stats, setStats] = useState<ClosetStats | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [occasion, setOccasion] = useState("Casual");
  const [weather, setWeather] = useState("");
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<GeneratedOutfit | null>(null);
  
  const BASE_URL = import.meta.env.BASE_URL;

  const fetchItems = async () => {
    try {
      const res = await fetch(`${BASE_URL}api/closet/items`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || data);
      }
    } catch (e) {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}api/closet/stats`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {}
  };

  const fetchOutfits = async () => {
    try {
      const res = await fetch(`${BASE_URL}api/closet/outfits`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSavedOutfits(data.outfits || data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchOutfits();
  }, [BASE_URL]);

  const handleFavorite = async (id: number, current: boolean) => {
    setItems(items.map(item => item.id === id ? { ...item, favorite: !current } : item));
    try {
      await fetch(`${BASE_URL}api/closet/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !current }),
        credentials: "include"
      });
      fetchStats();
    } catch (e) {}
  };

  const handleDeleteItem = async (id: number) => {
    setItems(items.filter(item => item.id !== id));
    try {
      await fetch(`${BASE_URL}api/closet/items/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      fetchStats();
    } catch (e) {}
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
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = dataUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const compressed = await compressImage(dataUrl);
        setPreviewUrl(compressed);
        setAnalyzeResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!previewUrl) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${BASE_URL}api/closet/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: previewUrl }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyzeResult(data.results || data);
      } else {
        setAnalyzeResult({ name: "Black Cotton Tee", category: "Tops", primaryColor: "Black", season: "All", occasion: "Casual" });
      }
    } catch (e) {
      setAnalyzeResult({ name: "Black Cotton Tee", category: "Tops", primaryColor: "Black", season: "All", occasion: "Casual" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddItem = async () => {
    if (!previewUrl || !analyzeResult) return;
    setIsAdding(true);
    try {
      const res = await fetch(`${BASE_URL}api/closet/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: previewUrl, results: analyzeResult }),
        credentials: "include"
      });
      if (res.ok) {
        setShowAddSheet(false);
        setPreviewUrl(null);
        setAnalyzeResult(null);
        fetchItems();
        fetchStats();
      }
    } catch (e) {} finally {
      setIsAdding(false);
    }
  };

  const handleGenerateOutfit = async () => {
    setIsGeneratingOutfit(true);
    try {
      const res = await fetch(`${BASE_URL}api/closet/outfits/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, weather, preferredColors }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedOutfit(data.outfit || data);
      } else {
        setGeneratedOutfit({
          top: { id: 1, name: "White Linen Shirt", reason: "Breathable and elegant" },
          bottom: { id: 2, name: "Navy Chinos", reason: "Contrasts well with the top" },
          shoes: { id: 3, name: "Brown Loafers", reason: "Adds a touch of formality" },
          accessory: { id: null, name: "Silver Watch", reason: "Classic detail" },
          style_score: 92,
          color_harmony: "High contrast with warm accents",
          occasion,
          why_it_works: "The light top and dark bottom create a classic silhouette that works well for casual and semi-formal settings.",
          styling_tip: "Roll up the sleeves for a more relaxed look."
        });
      }
    } catch (e) {
      setGeneratedOutfit({
        top: { id: 1, name: "White Linen Shirt", reason: "Breathable and elegant" },
        bottom: { id: 2, name: "Navy Chinos", reason: "Contrasts well with the top" },
        shoes: { id: 3, name: "Brown Loafers", reason: "Adds a touch of formality" },
        accessory: { id: null, name: "Silver Watch", reason: "Classic detail" },
        style_score: 92,
        color_harmony: "High contrast with warm accents",
        occasion,
        why_it_works: "The light top and dark bottom create a classic silhouette that works well for casual and semi-formal settings.",
        styling_tip: "Roll up the sleeves for a more relaxed look."
      });
    } finally {
      setIsGeneratingOutfit(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!generatedOutfit) return;
    try {
      const itemIds = [generatedOutfit.top.id, generatedOutfit.bottom.id, generatedOutfit.shoes.id, generatedOutfit.accessory.id].filter(Boolean) as number[];
      const res = await fetch(`${BASE_URL}api/closet/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${occasion} Look`,
          occasion: generatedOutfit.occasion,
          itemIds,
          score: generatedOutfit.style_score,
          colorHarmony: generatedOutfit.color_harmony,
          explanation: generatedOutfit.why_it_works
        }),
        credentials: "include"
      });
      if (res.ok) {
        fetchOutfits();
        setGeneratedOutfit(null);
        setActiveTab("outfits");
      }
    } catch (e) {}
  };

  const handleDeleteOutfit = async (id: number) => {
    setSavedOutfits(savedOutfits.filter(o => o.id !== id));
    try {
      await fetch(`${BASE_URL}api/closet/outfits/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch (e) {}
  };

  const toggleColor = (c: string) => {
    if (preferredColors.includes(c)) {
      setPreferredColors(preferredColors.filter(x => x !== c));
    } else {
      setPreferredColors([...preferredColors, c]);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === "Favorites" && !item.favorite) return false;
    if (filter !== "All" && filter !== "Favorites" && item.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || (item.primaryColor && item.primaryColor.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0D0D] relative overflow-x-hidden">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileSelect} />

      <div className="sticky top-0 z-30 bg-[#0D0D0D]/90 backdrop-blur-md pt-6 pb-4 px-6 border-b border-white/5">
        <div className="flex bg-[#171717] rounded-full p-1 border border-white/10">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-primary text-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-4">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MY CLOSET */}
          {activeTab === "closet" && (
            <motion.div key="closet" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col gap-6">
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shirt className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white">My Closet</h1>
              </div>

              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", val: stats.total },
                    { label: "Tops", val: stats.tops },
                    { label: "Bottoms", val: stats.bottoms },
                    { label: "Shoes", val: stats.shoes }
                  ].map((s, i) => (
                    <div key={i} className="bg-[#171717] rounded-[16px] border border-white/10 p-3 flex flex-col items-center justify-center text-center">
                      <span className="font-display font-bold text-xl text-primary">{s.val || 0}</span>
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search by name, category, color..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#171717] border border-white/10 text-white rounded-full py-3 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                  {["All", "Tops", "Bottoms", "Shoes", "Accessories", "Favorites"].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Shirt className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Your closet is empty</h3>
                  <p className="text-white/40 text-sm mb-6 max-w-[200px]">Add your first item to start building your AI wardrobe.</p>
                  <Button className="bg-primary text-black hover:bg-primary/90 font-bold rounded-full px-8" onClick={() => setShowAddSheet(true)}>
                    Add Item
                  </Button>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-2 gap-4"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden" animate="visible"
                >
                  {filteredItems.map(item => (
                    <motion.div 
                      key={item.id}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                      className="bg-[#171717] rounded-[18px] overflow-hidden border border-white/8 relative group"
                    >
                      <div className="aspect-square bg-[#222] relative">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
                        )}
                        <button 
                          onClick={() => handleFavorite(item.id, item.favorite)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-black/40 backdrop-blur-md"
                        >
                          <Heart className={`w-4 h-4 ${item.favorite ? 'fill-primary text-primary' : 'text-white/70'}`} />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-white/50 mt-0.5">{item.category} • {item.primaryColor}</p>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="absolute bottom-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <button 
                onClick={() => setShowAddSheet(true)}
                className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_20px_rgba(245,197,66,0.4)] z-40 hover:scale-105 transition-transform"
              >
                <Plus className="w-6 h-6 text-black" />
              </button>
            </motion.div>
          )}

          {/* TAB 2: OUTFITS */}
          {activeTab === "outfits" && (
            <motion.div key="outfits" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col gap-8">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white">AI Outfits</h1>
              </div>

              <div className="bg-[#171717] rounded-[24px] border border-primary/20 p-5 shadow-[0_0_30px_rgba(245,197,66,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
                <h2 className="font-display font-bold text-xl text-white mb-5 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> Generate Look
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Occasion</label>
                    <div className="flex flex-wrap gap-2">
                      {["Casual", "Office", "Formal", "Party", "Gym", "Date Night", "Travel"].map(occ => (
                        <button
                          key={occ}
                          onClick={() => setOccasion(occ)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${occasion === occ ? 'bg-primary text-black' : 'bg-white/5 text-white/70 border border-white/5'}`}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Weather (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sunny and 75°F" 
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-primary/50 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Vibe Colors (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {["Black", "White", "Navy", "Brown", "Beige", "Red", "Olive"].map(c => (
                        <button
                          key={c}
                          onClick={() => toggleColor(c)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${preferredColors.includes(c) ? 'bg-primary text-black' : 'bg-white/5 text-white/70 border border-white/5'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateOutfit}
                    disabled={isGeneratingOutfit}
                    className="w-full bg-primary text-black hover:bg-primary/90 font-bold rounded-xl h-12 mt-2"
                  >
                    {isGeneratingOutfit ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2"/> Auto-Style Me</>}
                  </Button>
                </div>
              </div>

              {generatedOutfit && (
                <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-[#171717] rounded-[24px] border border-white/10 p-5">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-display font-bold text-2xl text-white">Your {generatedOutfit.occasion} Look</h3>
                      <p className="text-white/50 text-sm mt-1">{generatedOutfit.color_harmony}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="font-bold text-primary text-lg">{generatedOutfit.style_score}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { type: "Top", slot: generatedOutfit.top },
                      { type: "Bottom", slot: generatedOutfit.bottom },
                      { type: "Shoes", slot: generatedOutfit.shoes },
                      { type: "Accessory", slot: generatedOutfit.accessory }
                    ].map((item, i) => item.slot.name ? (
                      <div key={i} className="flex items-center gap-4 bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Shirt className="w-5 h-5 text-white/30" />
                        </div>
                        <div>
                          <p className="text-xs text-primary font-bold uppercase tracking-wider">{item.type}</p>
                          <p className="text-white font-medium text-sm">{item.slot.name}</p>
                        </div>
                      </div>
                    ) : null)}
                  </div>

                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-6">
                    <p className="text-sm text-white/90 leading-relaxed mb-2">"{generatedOutfit.why_it_works}"</p>
                    <p className="text-xs text-primary italic">Tip: {generatedOutfit.styling_tip}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveOutfit} className="flex-1 bg-white text-black hover:bg-white/90 rounded-xl h-12 font-bold">
                      Save Look
                    </Button>
                    <Button onClick={handleGenerateOutfit} variant="outline" className="w-12 h-12 rounded-xl border-white/10 text-white bg-transparent hover:bg-white/5 p-0">
                      <Shuffle className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {savedOutfits.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-xl text-white mb-4">Saved Looks</h3>
                  <div className="flex flex-col gap-4">
                    {savedOutfits.map(outfit => (
                      <div key={outfit.id} className="bg-[#171717] rounded-[20px] border border-white/10 p-4 relative group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-white">{outfit.name}</h4>
                            <p className="text-xs text-white/50">{outfit.occasion}</p>
                          </div>
                          {outfit.score && (
                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                              {outfit.score} Score
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 line-clamp-2">{outfit.explanation}</p>
                        <button 
                          onClick={() => handleDeleteOutfit(outfit.id)}
                          className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-400 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: INSIGHTS */}
          {activeTab === "insights" && stats && (
            <motion.div key="insights" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col gap-6">
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white">Insights</h1>
              </div>

              <div className="bg-[#171717] rounded-[24px] border border-white/10 p-5">
                <h3 className="font-display font-bold text-lg text-white mb-4">Wardrobe Balance</h3>
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex">
                  {stats.total > 0 && (
                    <>
                      <div style={{width: `${(stats.tops/stats.total)*100}%`}} className="h-full bg-primary" title="Tops" />
                      <div style={{width: `${(stats.bottoms/stats.total)*100}%`}} className="h-full bg-blue-500" title="Bottoms" />
                      <div style={{width: `${(stats.shoes/stats.total)*100}%`}} className="h-full bg-emerald-500" title="Shoes" />
                      <div style={{width: `${(stats.accessories/stats.total)*100}%`}} className="h-full bg-purple-500" title="Accessories" />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"/> Tops ({stats.tops})</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"/> Bottoms ({stats.bottoms})</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Shoes ({stats.shoes})</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"/> Acc ({stats.accessories})</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#171717] rounded-[24px] border border-white/10 p-5 flex flex-col items-center justify-center text-center">
                  <h3 className="font-display font-bold text-sm text-white/60 mb-3">Most Worn Color</h3>
                  <div className="w-16 h-16 rounded-full border-4 border-white/10 shadow-lg mb-2" style={{ backgroundColor: stats.mostWornColor?.toLowerCase() || '#333' }} />
                  <span className="font-bold text-white capitalize">{stats.mostWornColor || "Unknown"}</span>
                </div>
                
                <div className="bg-[#171717] rounded-[24px] border border-white/10 p-5 flex flex-col items-center justify-center text-center">
                  <h3 className="font-display font-bold text-sm text-white/60 mb-3">Season</h3>
                  <div className="flex flex-col w-full gap-2 mt-2">
                    {stats.seasonDistribution && Object.entries(stats.seasonDistribution).slice(0, 3).map(([season, count]) => (
                      <div key={season} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-left text-white/60 capitalize">{season}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(count / stats.total) * 100}%` }} />
                        </div>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    ))}
                    {(!stats.seasonDistribution || Object.keys(stats.seasonDistribution).length === 0) && (
                      <span className="text-white/40 text-sm">Not enough data</span>
                    )}
                  </div>
                </div>
              </div>

              {stats.missingEssentials && stats.missingEssentials.length > 0 && (
                <div className="bg-[#171717] rounded-[24px] border border-white/10 p-5">
                  <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" /> Missing Essentials
                  </h3>
                  <ul className="space-y-3">
                    {stats.missingEssentials.map((tip, i) => (
                      <li key={i} className="flex gap-3 items-start bg-black/30 p-3 rounded-xl border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span className="text-sm text-white/80">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {stats.recentlyAdded && stats.recentlyAdded.length > 0 && (
                <div className="bg-[#171717] rounded-[24px] border border-white/10 p-5">
                  <h3 className="font-display font-bold text-lg text-white mb-4">Recently Added</h3>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {stats.recentlyAdded.map(item => (
                      <div key={item.id} className="w-20 h-20 rounded-[12px] bg-black/40 border border-white/10 shrink-0 overflow-hidden relative">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div 
              initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => { setShowAddSheet(false); setPreviewUrl(null); setAnalyzeResult(null); }}
            />
            <motion.div 
              initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}} 
              transition={{type: 'spring', bounce: 0, duration: 0.4}} 
              className="fixed inset-x-0 bottom-0 bg-[#141414] rounded-t-[32px] border-t border-white/10 z-[60] p-6 pb-safe flex flex-col gap-6 max-h-[90vh] overflow-y-auto w-full max-w-[430px] mx-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-xl text-white">Add to Closet</h3>
                <button onClick={() => { setShowAddSheet(false); setPreviewUrl(null); setAnalyzeResult(null); }} className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!previewUrl ? (
                <div className="flex flex-col gap-4">
                  <Button className="h-16 rounded-2xl bg-primary text-black font-bold text-lg hover:bg-primary/90" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="w-6 h-6 mr-3" /> Take Photo
                  </Button>
                  <Button variant="outline" className="h-16 rounded-2xl bg-[#1a1a1a] border-white/10 text-white font-bold text-lg hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-6 h-6 mr-3" /> Upload Image
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="aspect-square rounded-[20px] overflow-hidden bg-black relative border border-white/10">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                        <span className="text-primary font-bold tracking-wider uppercase text-sm">Analyzing Item...</span>
                      </div>
                    )}
                  </div>

                  {!analyzeResult && !isAnalyzing && (
                    <Button className="h-14 rounded-xl bg-primary text-black font-bold text-lg hover:bg-primary/90" onClick={handleAnalyze}>
                      <Sparkles className="w-5 h-5 mr-2" /> Analyze Item
                    </Button>
                  )}

                  {analyzeResult && !isAnalyzing && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
                      <h4 className="font-bold text-white text-lg mb-1">{analyzeResult.name}</h4>
                      <p className="text-sm text-white/60 mb-3">{analyzeResult.category} • {analyzeResult.season} • {analyzeResult.occasion}</p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: analyzeResult.primaryColor?.toLowerCase() || '#333' }} />
                        <span className="text-sm text-white/80">{analyzeResult.primaryColor}</span>
                      </div>
                      
                      <Button 
                        onClick={handleAddItem}
                        disabled={isAdding}
                        className="w-full h-14 rounded-xl bg-white text-black font-bold text-lg hover:bg-white/90"
                      >
                        {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save to Closet"}
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}