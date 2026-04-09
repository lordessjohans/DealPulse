import { motion } from "motion/react";
import { ExternalLink, TrendingUp } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: string;
  trendingScore: number;
}

interface Props {
  deals: Deal[];
}

export default function TrendingCarousel({ deals }: Props) {
  // Duplicate deals for seamless loop
  const displayDeals = [...deals, ...deals];

  return (
    <div className="w-full bg-zinc-900 overflow-hidden border-b border-zinc-800 py-2">
      <div className="flex items-center px-4 mb-1">
        <TrendingUp className="w-4 h-4 text-orange-500 mr-2" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Trending Now</span>
      </div>
      <motion.div 
        className="flex whitespace-nowrap"
        animate={{ x: [0, -100 * deals.length + "%"] }}
        transition={{ 
          duration: deals.length * 5, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {displayDeals.map((deal, i) => (
          <div 
            key={`${deal.id}-${i}`}
            className="inline-flex items-center mx-4 group cursor-pointer"
            onClick={() => window.open(deal.productUrl, "_blank")}
          >
            <img 
              src={deal.imageUrl} 
              alt="" 
              className="w-8 h-8 rounded object-cover mr-3 grayscale group-hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                {deal.title.length > 30 ? deal.title.substring(0, 30) + "..." : deal.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-500">${deal.price}</span>
                <span className="text-[10px] text-zinc-600 line-through">${deal.originalPrice}</span>
                <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1 rounded font-mono">
                  {deal.source}
                </span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-700 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
