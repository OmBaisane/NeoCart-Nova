import { connectDB } from "../config/db.js";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

const getRequiredSeedEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required seed environment variable: ${name}`);
  }

  return value;
};

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "Database seeding is disabled in production. Run the seed script only in a non-production environment.",
      );
      process.exit(1);
    }

    const adminEmail = getRequiredSeedEnv("SEED_ADMIN_EMAIL");
    const adminPassword = getRequiredSeedEnv("SEED_ADMIN_PASSWORD");
    const adminPhone = getRequiredSeedEnv("SEED_ADMIN_PHONE");

    const demoUserEmail = getRequiredSeedEnv("SEED_DEMO_USER_EMAIL");
    const demoUserPassword = getRequiredSeedEnv("SEED_DEMO_USER_PASSWORD");
    const demoUserPhone = getRequiredSeedEnv("SEED_DEMO_USER_PHONE");

    await connectDB();
    console.log("Connected to MongoDB. Starting development database seed...");

    await User.create({
      name: "NeoCart Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      phone: adminPhone,
    });

    await User.create({
      name: "NeoCart Demo User",
      email: demoUserEmail,
      password: demoUserPassword,
      role: "user",
      phone: demoUserPhone,
    });

    console.log("Admin and demo user seeded successfully.");

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

    console.log("Categories seeded successfully.");

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
        stock: 4,
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
        stock: 0,
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
    console.log("Development products seeded successfully.");

    console.log("Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

void seedDatabase();
