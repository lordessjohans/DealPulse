import React from "react";
import { Heart, ExternalLink, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export interface Deal {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: string;
  category: string;
  trendingScore: number;
}

interface Props {
  deal: Deal;
  isSaved?: boolean;
  onSave?: (deal: Deal) => void;
}

const DealCard: React.FC<Props> = ({ deal, isSaved, onSave }) => {
  const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all"
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={deal.imageUrl} 
          alt={deal.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
            -{discount}% OFF
          </span>
        </div>
        <button 
          onClick={() => onSave?.(deal)}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all",
            isSaved ? "bg-orange-500 text-white" : "bg-black/20 text-white hover:bg-black/40"
          )}
        >
          <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
        </button>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <button 
            onClick={() => window.open(deal.productUrl, "_blank")}
            className="w-full bg-white text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            View on {deal.source}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{deal.category}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-400">{deal.trendingScore}% Hot</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 mb-3 group-hover:text-white transition-colors">
          {deal.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-white">${deal.price.toFixed(2)}</span>
          <span className="text-xs text-zinc-600 line-through">${deal.originalPrice.toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DealCard;
