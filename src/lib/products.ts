import { prisma } from "./prisma";
import { getAvailability } from "./capacity";
import { todayDateStringInKolkata } from "./order-number";

export interface ProductAvailability {
  productId: string;
  available: number;
}

export const FALLBACK_PRODUCTS = [
  {
    id: "prod_c1_classic_fudge",
    code: "C1",
    name: "Classic Fudge Brownie",
    slug: "classic-fudge-brownie",
    description:
      "Our signature dense, fudgy brownie made with 55% dark Belgian chocolate and Amul butter — the one that started it all.",
    ingredients: "Dark chocolate, butter, eggs, sugar, refined flour, cocoa powder, vanilla",
    allergens: ["Egg", "Gluten", "Dairy"],
    isVeg: false,
    weightGrams: 90,
    sellingPricePaise: 15000,
    costOfMakingPaise: 6500,
    isFeatured: true,
    isActive: true,
    sortOrder: 0,
    images: ["/images/products/patisserie-brownie.png"],
    categoryId: "cat_brownies",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_brownies",
      name: "Brownies",
      slug: "brownies",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod_c2_walnut_fudge",
    code: "C2",
    name: "Walnut Fudge Brownie",
    slug: "walnut-fudge-brownie",
    description: "The classic fudge brownie loaded with roasted California walnuts for extra crunch.",
    ingredients: "Dark chocolate, butter, eggs, sugar, refined flour, walnuts, cocoa powder",
    allergens: ["Egg", "Gluten", "Dairy", "Tree Nuts"],
    isVeg: false,
    weightGrams: 95,
    sellingPricePaise: 17000,
    costOfMakingPaise: 7800,
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
    images: ["/images/products/patisserie-brownie.png"],
    categoryId: "cat_brownies",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_brownies",
      name: "Brownies",
      slug: "brownies",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod_c3_eggless_nutella",
    code: "C3",
    name: "Eggless Nutella Brownie",
    slug: "eggless-nutella-brownie",
    description:
      "100% eggless brownie swirled with Nutella, for our vegetarian customers who don't want to miss out.",
    ingredients: "Dark chocolate, butter, condensed milk, refined flour, Nutella, cocoa powder",
    allergens: ["Gluten", "Dairy", "Tree Nuts"],
    isVeg: true,
    weightGrams: 90,
    sellingPricePaise: 18000,
    costOfMakingPaise: 8200,
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    images: ["/images/products/patisserie-brownie.png"],
    categoryId: "cat_brownies",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_brownies",
      name: "Brownies",
      slug: "brownies",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod_c5_choco_chip_cookie",
    code: "C5",
    name: "Choco Chip Cookie",
    slug: "choco-chip-cookie",
    description: "Crisp-edged, chewy-centred classic chocolate chip cookie made with brown butter.",
    ingredients: "Butter, brown sugar, refined flour, chocolate chips, eggs, vanilla",
    allergens: ["Egg", "Gluten", "Dairy"],
    isVeg: false,
    weightGrams: 55,
    sellingPricePaise: 8000,
    costOfMakingPaise: 3400,
    isFeatured: true,
    isActive: true,
    sortOrder: 3,
    images: ["/images/products/patisserie-cookie.png"],
    categoryId: "cat_cookies",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_cookies",
      name: "Cookies",
      slug: "cookies",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod_c8_brownie_box_4",
    code: "C8",
    name: "Brownie Box of 4",
    slug: "brownie-box-of-4",
    description: "A mixed box of 4 classic fudge brownies — perfect for gifting or sharing.",
    ingredients: "See individual brownie ingredients",
    allergens: ["Egg", "Gluten", "Dairy"],
    isVeg: false,
    weightGrams: 380,
    sellingPricePaise: 55000,
    costOfMakingPaise: 24000,
    isFeatured: true,
    isActive: true,
    sortOrder: 4,
    images: ["/images/products/patisserie-box.png"],
    categoryId: "cat_combo_boxes",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_combo_boxes",
      name: "Combo Boxes",
      slug: "combo-boxes",
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: "prod_c14_celebration_hamper",
    code: "C14",
    name: "Grand Celebration Hamper",
    slug: "grand-celebration-hamper",
    description: "Our biggest gift hamper — 4 brownies, 8 assorted cookies and a handwritten note card.",
    ingredients: "See individual item ingredients",
    allergens: ["Egg", "Gluten", "Dairy", "Tree Nuts"],
    isVeg: false,
    weightGrams: 900,
    sellingPricePaise: 95000,
    costOfMakingPaise: 42000,
    isFeatured: true,
    isActive: true,
    sortOrder: 5,
    images: ["/images/products/patisserie-box.png"],
    categoryId: "cat_gift_hampers",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_gift_hampers",
      name: "Gift Hampers",
      slug: "gift-hampers",
      sortOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

/** Returns per-product remaining capacity for a given date (defaults to today, Asia/Kolkata). */
export async function getMenuAvailability(productIds: string[], dateStr?: string): Promise<Record<string, number>> {
  const date = new Date(dateStr ?? todayDateStringInKolkata());
  const result: Record<string, number> = {};
  for (const id of productIds) {
    try {
      const availability = await getAvailability(id, date);
      result[id] = availability.available;
    } catch {
      result[id] = 12; // Fallback capacity when DB is unseeded/offline
    }
  }
  return result;
}

export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    });
    if (products.length > 0) return products;
  } catch (error) {
    console.warn("[products] Database unreachable, using fallback featured products:", (error as Error).message);
  }
  return FALLBACK_PRODUCTS.filter((p) => p.isFeatured).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category, ...rest } = p;
    return rest;
  });
}

export async function getAllActiveProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });
    if (products.length > 0) return products;
  } catch (error) {
    console.warn("[products] Database unreachable, using fallback active products:", (error as Error).message);
  }
  return FALLBACK_PRODUCTS;
}
