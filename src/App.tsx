import { useState, useEffect } from "react";
import { auth, db, signIn, signOut } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { LogIn, LogOut, Heart, ShoppingCart, Sparkles, Zap, Github, Search, X, Globe } from "lucide-react";
import TrendingCarousel from "./components/TrendingCarousel";
import VisualSearch from "./components/VisualSearch";
import DealCard from "./components/DealCard";
import { motion, AnimatePresence } from "motion/react";
import { searchGoogleShoppingDeals } from "./lib/gemini";

interface Deal {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: string;
  category: string;
  trendingScore: number;
  salesCount?: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"home" | "store">("home");
  const [googleDeals, setGoogleDeals] = useState<Deal[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch trending deals from our API
    fetch("/api/trending")
      .then(res => res.json())
      .then(data => setDeals(data));
  }, []);

  useEffect(() => {
    const fetchDailyPicks = async () => {
      const lastFetch = localStorage.getItem("last_google_search_date");
      const today = new Date().toDateString();
      
      if (lastFetch === today) {
        const cached = localStorage.getItem("google_deals_cache");
        if (cached) {
          setGoogleDeals(JSON.parse(cached));
          return;
        }
      }

      setIsLoadingGoogle(true);
      const newDeals = await searchGoogleShoppingDeals();
      const formattedDeals = newDeals.map((d: any, i: number) => ({
        ...d,
        id: d.id || `google-${i}`,
        source: "Google Shopping",
        category: d.category || "General",
        trendingScore: d.trendingScore || 90,
        imageUrl: d.imageUrl || `https://picsum.photos/seed/google-${i}/400/400`
      }));
      
      setGoogleDeals(formattedDeals);
      localStorage.setItem("google_deals_cache", JSON.stringify(formattedDeals));
      localStorage.setItem("last_google_search_date", today);
      setIsLoadingGoogle(false);
    };

    fetchDailyPicks();
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    const q = query(collection(db, `users/${user.uid}/wishlist`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWishlist(snapshot.docs.map(doc => doc.data().dealId));
    });
    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (deal: Deal) => {
    if (!user) {
      signIn();
      return;
    }

    const itemRef = doc(db, `users/${user.uid}/wishlist`, deal.id);
    if (wishlist.includes(deal.id)) {
      await deleteDoc(itemRef);
    } else {
      await setDoc(itemRef, {
        dealId: deal.id,
        addedAt: serverTimestamp(),
        dealData: deal
      });
    }
  };

  const allDeals = [...deals, ...googleDeals];

  const filteredDeals = allDeals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        deal.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || deal.source.toLowerCase() === activeTab.toLowerCase();
    const matchesCategory = activeCategory === "all" || deal.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesTab && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(allDeals.map(d => d.category)))];

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-orange-500/30">
      {/* Top Trending Bar */}
      <TrendingCarousel deals={deals} />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">DealPulse</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setCurrentView("home")}
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                currentView === "home" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentView("store")}
              className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                currentView === "store" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Best Sellers Store
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 hover:bg-zinc-900 rounded-xl transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
                <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full border border-zinc-800" />
                <button onClick={signOut} className="text-zinc-500 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero & Search */}
      {currentView === "home" ? (
        <>
          <section className="relative py-20 px-4 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-orange-600/10 blur-[120px] rounded-full -z-10" />
            <div className="max-w-4xl mx-auto text-center mb-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full mb-6"
              >
                <Sparkles className="w-3 h-3 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI-Powered Deal Discovery</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight"
              >
                Find the <span className="text-orange-600">Best Deals</span> <br />Across the Globe.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-500 text-lg max-w-2xl mx-auto mb-10"
              >
                We scrape Alibaba, Temu, and AliExpress daily to bring you the hottest trending items. 
                Use our visual search to find anything instantly.
              </motion.p>
              
              <VisualSearch onSearch={setSearchQuery} />
            </div>
          </section>

          {/* Main Grid */}
          <main className="max-w-7xl mx-auto px-4 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeCategory === cat 
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                        : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                {["All", "AliExpress", "Temu", "Alibaba", "Google Shopping"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                      activeTab === tab.toLowerCase() 
                        ? "bg-zinc-800 text-white" 
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {googleDeals.length > 0 && activeTab === "all" && !searchQuery && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <Globe className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Daily AI Picks</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Sourced from Google Shopping</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {googleDeals.slice(0, 4).map(deal => (
                    <DealCard 
                      key={deal.id} 
                      deal={deal} 
                      isSaved={wishlist.includes(deal.id)}
                      onSave={toggleWishlist}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
                {searchQuery ? `Search Results for "${searchQuery}"` : "Today's Hot Deals"}
              </h2>
              <div className="text-xs font-mono text-zinc-500">
                Showing {filteredDeals.length} items
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredDeals.map(deal => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    isSaved={wishlist.includes(deal.id)}
                    onSave={toggleWishlist}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredDeals.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-zinc-700" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300">No deals found</h3>
                <p className="text-zinc-500">Try searching for something else or upload an image.</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white mb-4">Best Sellers Store</h1>
            <p className="text-zinc-500">The most purchased items across all marketplaces, curated by AI.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allDeals
              .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
              .map(deal => (
                <div key={deal.id} className="relative">
                  <DealCard 
                    deal={deal} 
                    isSaved={wishlist.includes(deal.id)}
                    onSave={toggleWishlist}
                  />
                  {deal.salesCount && (
                    <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl z-10">
                      {deal.salesCount.toLocaleString()}+ SOLD
                    </div>
                  )}
                </div>
              ))}
          </div>
        </main>
      )}

      {/* Wishlist Sidebar (Simplified) */}
      <AnimatePresence>
        {isWishlistOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-900 z-50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Heart className="w-6 h-6 text-orange-600 fill-current" />
                  Wishlist
                </h2>
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-2 hover:bg-zinc-900 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
                {wishlist.length === 0 ? (
                  <div className="text-center py-20">
                    <Heart className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500">Your wishlist is empty.</p>
                  </div>
                ) : (
                  deals.filter(d => wishlist.includes(d.id)).map(deal => (
                    <div key={deal.id} className="flex gap-4 p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group">
                      <img src={deal.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{deal.title}</h4>
                        <p className="text-xs text-zinc-500 mb-2">{deal.source}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-orange-500">${deal.price}</span>
                          <button 
                            onClick={() => toggleWishlist(deal)}
                            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-600 fill-current" />
            <span className="text-xl font-black tracking-tighter text-white uppercase">DealPulse</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
              <Github className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
          © 2026 DealPulse AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
