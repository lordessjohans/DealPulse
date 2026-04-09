import React, { useState, useRef } from "react";
import { Camera, Search, X, Loader2, Image as ImageIcon } from "lucide-react";
import { analyzeImageForSearch } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onSearch: (query: string) => void;
}

export default function VisualSearch({ onSearch }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setIsAnalyzing(true);
      
      const base64Data = base64.split(',')[1];
      const keywords = await analyzeImageForSearch(base64Data);
      
      setIsAnalyzing(false);
      if (keywords) {
        onSearch(keywords);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-2xl focus-within:border-orange-500/50 transition-all">
        <div className="pl-4 pr-2">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <input 
          type="text" 
          placeholder="Search for best deals or upload an image..."
          className="flex-1 bg-transparent border-none outline-none py-3 text-zinc-200 placeholder:text-zinc-600"
          onChange={(e) => onSearch(e.target.value)}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 hover:bg-zinc-800 rounded-xl transition-colors group relative"
          title="Visual Search"
        >
          <Camera className="w-5 h-5 text-zinc-400 group-hover:text-orange-500" />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 z-50 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-800">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-200">Visual Search Active</h4>
                <p className="text-xs text-zinc-500">
                  {isAnalyzing ? "Analyzing image with Gemini AI..." : "Showing results similar to your image."}
                </p>
              </div>
              <button 
                onClick={() => {
                  setPreview(null);
                  onSearch("");
                }}
                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
