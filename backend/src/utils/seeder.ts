import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";

const seedDatabase = async () => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const forceFlag = process.argv.includes("--force-production-seed");

    if (isProduction && !forceFlag) {
      console.error(
        "CRITICAL ERROR: Destructive database seeding is prohibited in production without the explicit '--force-production-seed' flag.",
      );
      process.exit(1);
    }

    await connectDB();
    console.log("Connected to MongoDB. Starting database seed...");

    // 2. Admin User create karo
    const adminUser = await User.create({
      name: "NeoCart Admin",
      email: "admin@neocart.com",
      password: "AdminPassword123",
      role: "admin",
      phone: "+91 9876543210",
    });

    const demoUser = await User.create({
      name: "Om Baisane",
      email: "om@example.com",
      password: "UserPassword123",
      role: "user",
      phone: "+91 9988776655",
    });
    console.log("👤 Admin & Demo user seeded successfully.");

    // 3. Realistic Categories create karo
    const categories = await Category.insertMany([
      {
        name: "Audio Gear",
        slug: "audio-gear",
        description: "Premium headphones, studio monitors, and wireless buds.",
      },
      {
        name: "Electronics",
        slug: "electronics",
        description: "Next-generation smart wearables and workstations.",
      },
      {
        name: "Footwear",
        slug: "footwear",
        description: "High-performance athletic sneakers and lifestyle kicks.",
      },
      {
        name: "Everyday Essentials",
        slug: "everyday-essentials",
        description: "Minimalist backpacks, EDC organizers, and travel gear.",
      },
    ]);
    console.log("📁 Categories seeded.");

    // 4. Products with verified stock & images
    const products = [
      {
        name: "Nova Pro Wireless ANC Headphones",
        slug: "nova-pro-wireless-anc-headphones",
        description:
          "Industry-leading active noise cancellation with 40mm titanium drivers, 45-hour battery life, and ultra-low latency wireless streaming for audiophiles.",
        price: 14999,
        discountPrice: 11999,
        category: categories[0]._id,
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
        ],
        isFeatured: true,
        isActive: true,
        rating: 4.8,
        reviewCount: 24,
      },
      {
        name: "AeroGlide Ultra Ergonomic Sneaker",
        slug: "aeroglide-ultra-ergonomic-sneaker",
        description:
          "Engineered for maximum kinetic return. Breathable carbon mesh upper combined with dual-density foam midsoles for unmatched comfort.",
        price: 7499,
        discountPrice: 5999,
        category: categories[2]._id,
        stock: 4, // Low stock badge test karne ke liye
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
          "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
        ],
        isFeatured: true,
        isActive: true,
        rating: 4.6,
        reviewCount: 18,
      },
      {
        name: "Chronos Titanium Smartwatch V2",
        slug: "chronos-titanium-smartwatch-v2",
        description:
          "Aerospace-grade titanium bezel with sapphire glass display. Features real-time ECG monitoring, dual-band GPS, and 14-day standby time.",
        price: 22999,
        discountPrice: 19999,
        category: categories[1]._id,
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
        ],
        isFeatured: true,
        isActive: true,
        rating: 4.9,
        reviewCount: 31,
      },
      {
        name: "Stealth EDC Modular Commuter Backpack",
        slug: "stealth-edc-modular-commuter-backpack",
        description:
          "Waterproof Cordura fabric with magnetic Fidlock buckles, dedicated 16-inch laptop compartment, and concealed anti-theft security pockets.",
        price: 4999,
        category: categories[3]._id,
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
          "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
        ],
        isFeatured: true,
        isActive: true,
        rating: 4.7,
        reviewCount: 15,
      },
      {
        name: "Vortex Mechanical Gaming Keyboard",
        slug: "vortex-mechanical-gaming-keyboard",
        description:
          "Custom hot-swappable linear switches with per-key RGB backlighting, aluminum chassis, and sound-dampening silicone internal padding.",
        price: 8999,
        discountPrice: 6999,
        category: categories[1]._id,
        stock: 8,
        images: [
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
        ],
        isFeatured: false,
        isActive: true,
        rating: 4.5,
        reviewCount: 9,
      },
      {
        name: "SonicBlast Portable Studio Speaker",
        slug: "sonicblast-portable-studio-speaker",
        description:
          "360-degree acoustic omni-directional sound with punchy bass radiators, IPX7 waterproof rating, and 24-hour continuous playtime.",
        price: 5499,
        category: categories[0]._id,
        stock: 0, // Out of Stock test karne ke liye
        images: [
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
        ],
        isFeatured: false,
        isActive: true,
        rating: 4.2,
        reviewCount: 6,
      },
    ];

    await Product.insertMany(products);
    console.log("📦 6 Production-quality products seeded successfully.");

    console.log("\n✅ Database seeding completed perfectly!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
