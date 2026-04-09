import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock data for trending items (simulating daily scrape)
  const MOCK_DEALS = [
    {
      id: "1",
      title: "Wireless Noise Cancelling Headphones",
      price: 29.99,
      originalPrice: 89.99,
      imageUrl: "https://picsum.photos/seed/headphones/400/400",
      productUrl: "https://aliexpress.com",
      source: "AliExpress",
      category: "Electronics",
      trendingScore: 98
    },
    {
      id: "2",
      title: "Smart Watch Series 9 Clone",
      price: 15.50,
      originalPrice: 45.00,
      imageUrl: "https://picsum.photos/seed/watch/400/400",
      productUrl: "https://temu.com",
      source: "Temu",
      category: "Electronics",
      trendingScore: 95
    },
    {
      id: "3",
      title: "Ergonomic Mesh Office Chair",
      price: 120.00,
      originalPrice: 250.00,
      imageUrl: "https://picsum.photos/seed/chair/400/400",
      productUrl: "https://alibaba.com",
      source: "Alibaba",
      category: "Furniture",
      trendingScore: 92
    },
    {
      id: "4",
      title: "Portable Espresso Maker",
      price: 34.20,
      originalPrice: 75.00,
      imageUrl: "https://picsum.photos/seed/coffee/400/400",
      productUrl: "https://temu.com",
      source: "Temu",
      category: "Kitchen",
      trendingScore: 88
    },
    {
      id: "5",
      title: "RGB Mechanical Keyboard",
      price: 42.00,
      originalPrice: 99.00,
      imageUrl: "https://picsum.photos/seed/keyboard/400/400",
      productUrl: "https://aliexpress.com",
      source: "AliExpress",
      category: "Electronics",
      trendingScore: 85
    }
  ];

  // API Routes
  app.get("/api/trending", (req, res) => {
    res.json(MOCK_DEALS);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
