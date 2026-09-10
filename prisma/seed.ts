import { PrismaClient, ExpenseCategory, OrderStatus, PaymentStatus, FulfilmentType } from "@prisma/client";
import { addDays, subDays, format } from "date-fns";
import { existsSync } from "fs";
import path from "path";
import { DEFAULT_THEME } from "../src/lib/theme";
import { hashPassword } from "../src/lib/providers/auth/sandbox";

const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const prisma = new PrismaClient();
const isMinimal = process.argv.includes("--minimal");
const ORDER_COUNT = isMinimal ? 5 : 40;
const EXPENSE_COUNT = isMinimal ? 3 : 20;
const SEED_RUN_ID = `${Date.now()}`.slice(-6);
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@bakery.local";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

const CATEGORIES = [
  { name: "Brownies", slug: "brownies", sortOrder: 0 },
  { name: "Cookies", slug: "cookies", sortOrder: 1 },
  { name: "Combo Boxes", slug: "combo-boxes", sortOrder: 2 },
  { name: "Seasonal", slug: "seasonal", sortOrder: 3 },
  { name: "Gift Hampers", slug: "gift-hampers", sortOrder: 4 },
];

const PRODUCTS = [
  {
    code: "C1", categoryslug: "brownies", name: "Classic Fudge Brownie",
    slug: "classic-fudge-brownie",
    description: "Our signature dense, fudgy brownie made with 55% dark Belgian chocolate and Amul butter — the one that started it all.",
    ingredients: "Dark chocolate, butter, eggs, sugar, refined flour, cocoa powder, vanilla",
    allergens: ["Egg", "Gluten", "Dairy"], isVeg: false, weightGrams: 90,
    sellingPricePaise: 15000, costOfMakingPaise: 6500, isFeatured: true, weekdayMax: 8, weekendMax: 12,
  },
  {
    code: "C2", categoryslug: "brownies", name: "Walnut Fudge Brownie",
    slug: "walnut-fudge-brownie",
    description: "The classic fudge brownie loaded with roasted California walnuts for extra crunch.",
    ingredients: "Dark chocolate, butter, eggs, sugar, refined flour, walnuts, cocoa powder",
    allergens: ["Egg", "Gluten", "Dairy", "Tree Nuts"], isVeg: false, weightGrams: 95,
    sellingPricePaise: 17000, costOfMakingPaise: 7800, isFeatured: true, weekdayMax: 4, weekendMax: 8,
  },
  {
    code: "C3", categoryslug: "brownies", name: "Eggless Nutella Brownie",
    slug: "eggless-nutella-brownie",
    description: "100% eggless brownie swirled with Nutella, for our vegetarian customers who don't want to miss out.",
    ingredients: "Dark chocolate, butter, condensed milk, refined flour, Nutella, cocoa powder",
    allergens: ["Gluten", "Dairy", "Tree Nuts"], isVeg: true, weightGrams: 90,
    sellingPricePaise: 18000, costOfMakingPaise: 8200, isFeatured: true, weekdayMax: 6, weekendMax: 10,
  },
  {
    code: "C4", categoryslug: "brownies", name: "Biscoff Brownie",
    slug: "biscoff-brownie",
    description: "Fudgy chocolate brownie topped with crushed Biscoff cookies and a swirl of Biscoff spread.",
    ingredients: "Dark chocolate, butter, eggs, sugar, refined flour, Biscoff spread, Biscoff cookies",
    allergens: ["Egg", "Gluten", "Dairy", "Soy"], isVeg: false, weightGrams: 95,
    sellingPricePaise: 19000, costOfMakingPaise: 8700, isFeatured: false, weekdayMax: 5, weekendMax: 9,
  },
  {
    code: "C5", categoryslug: "cookies", name: "Choco Chip Cookie",
    slug: "choco-chip-cookie",
    description: "Crisp-edged, chewy-centred classic chocolate chip cookie made with brown butter.",
    ingredients: "Butter, brown sugar, refined flour, chocolate chips, eggs, vanilla",
    allergens: ["Egg", "Gluten", "Dairy"], isVeg: false, weightGrams: 55,
    sellingPricePaise: 8000, costOfMakingPaise: 3400, isFeatured: true, weekdayMax: 10, weekendMax: 16,
  },
  {
    code: "C6", categoryslug: "cookies", name: "Double Chocolate Cookie",
    slug: "double-chocolate-cookie",
    description: "Rich cocoa cookie dough loaded with dark chocolate chunks — for the serious chocolate lover.",
    ingredients: "Butter, cocoa powder, refined flour, dark chocolate chunks, eggs, sugar",
    allergens: ["Egg", "Gluten", "Dairy"], isVeg: false, weightGrams: 55,
    sellingPricePaise: 8500, costOfMakingPaise: 3700, isFeatured: false, weekdayMax: 10, weekendMax: 16,
  },
  {
    code: "C7", categoryslug: "cookies", name: "Eggless Oats & Raisin Cookie",
    slug: "eggless-oats-raisin-cookie",
    description: "A wholesome eggless cookie with rolled oats, raisins and a hint of cinnamon.",
    ingredients: "Butter, rolled oats, refined flour, raisins, jaggery, cinnamon",
    allergens: ["Gluten", "Dairy"], isVeg: true, weightGrams: 50,
    sellingPricePaise: 7500, costOfMakingPaise: 3100, isFeatured: false, weekdayMax: 8, weekendMax: 12,
  },
  {
    code: "C8", categoryslug: "combo-boxes", name: "Brownie Box of 4",
    slug: "brownie-box-of-4",
    description: "A mixed box of 4 classic fudge brownies — perfect for gifting or sharing.",
    ingredients: "See individual brownie ingredients", allergens: ["Egg", "Gluten", "Dairy"],
    isVeg: false, weightGrams: 380,
    sellingPricePaise: 55000, costOfMakingPaise: 24000, isFeatured: true, weekdayMax: 5, weekendMax: 8,
  },
  {
    code: "C9", categoryslug: "combo-boxes", name: "Cookie Jar (Box of 8)",
    slug: "cookie-jar-box-of-8",
    description: "An assorted jar of 8 cookies — 4 choco chip and 4 double chocolate.",
    ingredients: "See individual cookie ingredients", allergens: ["Egg", "Gluten", "Dairy"],
    isVeg: false, weightGrams: 440,
    sellingPricePaise: 60000, costOfMakingPaise: 26000, isFeatured: false, weekdayMax: 5, weekendMax: 8,
  },
  {
    code: "C10", categoryslug: "seasonal", name: "Red Velvet Brownie",
    slug: "red-velvet-brownie",
    description: "A festive twist on our classic brownie with cream cheese swirl — available in season.",
    ingredients: "Butter, cocoa, red velvet flavouring, cream cheese, eggs, sugar, refined flour",
    allergens: ["Egg", "Gluten", "Dairy"], isVeg: false, weightGrams: 95,
    sellingPricePaise: 19500, costOfMakingPaise: 9000, isFeatured: false, weekdayMax: 4, weekendMax: 6,
  },
  {
    code: "C11", categoryslug: "seasonal", name: "Gingerbread Cookie",
    slug: "gingerbread-cookie",
    description: "Warmly spiced holiday cookie with ginger, cinnamon and molasses.",
    ingredients: "Butter, molasses, ginger, cinnamon, refined flour, eggs",
    allergens: ["Egg", "Gluten", "Dairy"], isVeg: false, weightGrams: 50,
    sellingPricePaise: 9000, costOfMakingPaise: 3800, isFeatured: false, weekdayMax: 6, weekendMax: 10,
  },
  {
    code: "C12", categoryslug: "cookies", name: "Peanut Butter Cookie",
    slug: "peanut-butter-cookie",
    description: "Classic crumbly peanut butter cookie with a hint of sea salt.",
    ingredients: "Peanut butter, butter, sugar, refined flour, eggs, sea salt",
    allergens: ["Egg", "Gluten", "Dairy", "Peanuts"], isVeg: false, weightGrams: 55,
    sellingPricePaise: 8500, costOfMakingPaise: 3600, isFeatured: false, weekdayMax: 8, weekendMax: 12,
  },
  {
    code: "C13", categoryslug: "cookies", name: "White Chocolate Macadamia Cookie",
    slug: "white-chocolate-macadamia-cookie",
    description: "Buttery cookie loaded with white chocolate chunks and roasted macadamia nuts.",
    ingredients: "Butter, white chocolate, macadamia nuts, refined flour, eggs, sugar",
    allergens: ["Egg", "Gluten", "Dairy", "Tree Nuts"], isVeg: false, weightGrams: 55,
    sellingPricePaise: 9500, costOfMakingPaise: 4200, isFeatured: true, weekdayMax: 6, weekendMax: 10,
  },
  {
    code: "C14", categoryslug: "gift-hampers", name: "Grand Celebration Hamper",
    slug: "grand-celebration-hamper",
    description: "Our biggest gift hamper — 4 brownies, 8 assorted cookies and a handwritten note card.",
    ingredients: "See individual item ingredients", allergens: ["Egg", "Gluten", "Dairy", "Tree Nuts"],
    isVeg: false, weightGrams: 900,
    sellingPricePaise: 95000, costOfMakingPaise: 42000, isFeatured: true, weekdayMax: 3, weekendMax: 5,
  },
  {
    code: "C15", categoryslug: "gift-hampers", name: "Eggless Delight Hamper",
    slug: "eggless-delight-hamper",
    description: "A fully eggless hamper — 2 Nutella brownies and 6 oats & raisin cookies.",
    ingredients: "See individual item ingredients", allergens: ["Gluten", "Dairy", "Tree Nuts"],
    isVeg: true, weightGrams: 620,
    sellingPricePaise: 65000, costOfMakingPaise: 28000, isFeatured: false, weekdayMax: 4, weekendMax: 6,
  },
];

function productImagePath(product: (typeof PRODUCTS)[number]) {
  if (product.categoryslug === "combo-boxes" || product.categoryslug === "gift-hampers") {
    return "/images/products/patisserie-box.png";
  }
  if (product.categoryslug === "cookies" || product.slug.endsWith("cookie")) {
    return "/images/products/patisserie-cookie.png";
  }
  return "/images/products/patisserie-brownie.png";
}

async function main() {
  console.log("Seeding XOXO Patisserie...");

  await prisma.siteSettings.upsert({
    where: { isSingleton: true },
    update: {},
    create: {
      isSingleton: true,
      theme: DEFAULT_THEME as unknown as object,
      businessName: "XOXO Patisserie",
      tagline: "Brownies made with a lot of love, butter & good vibes",
      heroHeading: "A little sweetness, made to linger.",
      heroSubheading:
        "Small-batch brownies, cookies and gifting treats, baked fresh by XOXO Patisserie in Chennai.",
      heroCtaLabel: "Order Now",
      heroImageUrl: "/images/hero-patisserie.png",
      aboutHeading: "A Little Sweeter Life",
      aboutCopy:
        "At XOXO Patisserie, every brownie is baked with love, intention and the finest ingredients. What started as a small kitchen experiment is now a sweet little dream we get to share with you — rich, fudgy, and completely free of preservatives, baked fresh in small batches for every order.",
      footerCopy: "Good things are sweeter together.",
      whyUsCopy: [
        { title: "Small Batch Goodness", body: "Baked in small batches, never a factory line." },
        { title: "Premium Ingredients", body: "Just butter, chocolate, sugar and love." },
        { title: "Pre-Order Only", body: "Freshly baked for you — never sitting on a shelf." },
        { title: "Hygienic Kitchen", body: "FSSAI licensed and inspected." },
      ],
      testimonials: [
        { name: "Priya R.", quote: "The fudge brownies are unreal — better than any bakery in Chennai." },
        { name: "Karthik S.", quote: "Ordered for a birthday, arrived perfectly on time and beautifully packed." },
        { name: "Meera N.", quote: "Finally an eggless option that doesn't compromise on taste!" },
      ],
      faq: [
        { q: "What areas do you deliver to?", a: "We currently deliver across most of Chennai. Enter your pincode at checkout to confirm." },
        { q: "How much lead time do you need?", a: "We need at least 24 hours' notice for all orders." },
        { q: "How long do brownies/cookies stay fresh?", a: "Best enjoyed within 3-4 days at room temperature, or up to 10 days refrigerated." },
        { q: "Can I customise a box?", a: "Yes! Message us on WhatsApp for custom combinations and messages on the box." },
        { q: "What payment methods do you accept?", a: "UPI (GPay/PhonePe/Paytm), cards, netbanking and wallets via Razorpay." },
        { q: "Can I cancel my order?", a: "Orders can be cancelled up to 12 hours before the requested date — message us on WhatsApp." },
      ],
      serviceablePincodes: [
        "600001","600002","600004","600005","600006","600008","600010","600017",
        "600018","600020","600028","600032","600040","600041","600042","600083","600090","600096",
      ],
    },
  });

  const categoryIdBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoryIdBySlug[c.slug] = cat.id;
  }

  const productIdByCode: Record<string, string> = {};
  for (const p of PRODUCTS) {
    const imagePath = productImagePath(p);
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { images: [imagePath] },
      create: {
        categoryId: categoryIdBySlug[p.categoryslug],
        name: p.name,
        slug: p.slug,
        code: p.code,
        description: p.description,
        ingredients: p.ingredients,
        allergens: p.allergens,
        images: [imagePath],
        isVeg: p.isVeg,
        sellingPricePaise: p.sellingPricePaise,
        costOfMakingPaise: p.costOfMakingPaise,
        weightGrams: p.weightGrams,
        isFeatured: p.isFeatured,
      },
    });
    productIdByCode[p.code] = product.id;

    await prisma.capacityDefault.upsert({
      where: { productId: product.id },
      update: { weekdayMax: p.weekdayMax, weekendMax: p.weekendMax },
      create: { productId: product.id, weekdayMax: p.weekdayMax, weekendMax: p.weekendMax },
    });

    // Seed 30 days of daily capacity
    for (let i = 0; i < 30; i++) {
      const date = addDays(new Date(new Date().toDateString()), i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      await prisma.dailyCapacity.upsert({
        where: { productId_date: { productId: product.id, date } },
        update: {},
        create: {
          productId: product.id,
          date,
          maxQuantity: isWeekend ? p.weekendMax : p.weekdayMax,
        },
      });
    }
  }

  // Variants for combo boxes
  const comboId = productIdByCode["C8"];
  if (comboId) {
    await prisma.productVariant.upsert({
      where: { id: "seed-variant-box6" },
      update: {},
      create: {
        id: "seed-variant-box6",
        productId: comboId,
        name: "Box of 6",
        priceDeltaPaise: 25000,
        costDeltaPaise: 11000,
      },
    });
  }

  // Seed initial demo customers, orders, and expenses only if none exist yet
  const existingOrdersCount = await prisma.order.count();
  if (existingOrdersCount === 0) {
    // Customers
    const customerNames = [
      "Priya Ramesh","Karthik Subramaniam","Meera Natarajan","Arun Kumar","Divya Iyer",
      "Vignesh Raja","Lakshmi Venkatesh","Suresh Babu","Anitha Krishnan","Rahul Menon",
      "Sneha Pillai","Vivek Chandran",
    ];
    const customers = [];
    for (let i = 0; i < customerNames.length; i++) {
      const phone = `+9198765${(43210 + i).toString().padStart(5, "0")}`;
      const customer = await prisma.customer.upsert({
        where: { phone },
        update: {},
        create: {
          phone,
          name: customerNames[i],
          email: `${customerNames[i].toLowerCase().replace(/\s/g, ".")}@example.com`,
        },
      });
      const address = await prisma.address.create({
        data: {
          customerId: customer.id,
          line1: `${10 + i}, ${["Gandhi Nagar", "Anna Salai", "T Nagar Main Road", "Besant Nagar"][i % 4]}`,
          area: ["T Nagar", "Adyar", "Mylapore", "Velachery"][i % 4],
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: ["600017", "600020", "600004", "600042"][i % 4],
          isDefault: true,
        },
      });
      customers.push({ customer, address });
    }

    // Orders across the last 60 days
    const products = await prisma.product.findMany();
    const statuses: OrderStatus[] = [
      OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
      OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PACKED, OrderStatus.BAKED, OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING_PAYMENT,
    ];

    for (let i = 0; i < ORDER_COUNT; i++) {
      const { customer, address } = customers[i % customers.length];
      const orderDate = subDays(new Date(), Math.floor(Math.random() * 90));
      const status = statuses[i % statuses.length];
      const numItems = 1 + Math.floor(Math.random() * 3);
      const pickedProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, numItems);

      let subtotal = 0;
      const itemsData = pickedProducts.map((p) => {
        const qty = 1 + Math.floor(Math.random() * 3);
        const lineTotal = p.sellingPricePaise * qty;
        subtotal += lineTotal;
        return {
          productId: p.id,
          nameSnapshot: p.name,
          codeSnapshot: p.code,
          unitPricePaise: p.sellingPricePaise,
          unitCostPaise: p.costOfMakingPaise,
          quantity: qty,
          lineTotalPaise: lineTotal,
        };
      });

      const gst = Math.round(subtotal * 0.05);
      const packaging = 3000;
      const total = subtotal + gst + packaging;
      const paymentStatus: PaymentStatus =
        status === "PAYMENT_FAILED" ? PaymentStatus.FAILED
        : status === "PENDING_PAYMENT" ? PaymentStatus.PENDING
        : status === "REFUNDED" ? PaymentStatus.REFUNDED
        : PaymentStatus.PAID;

      const order = await prisma.order.create({
        data: {
          orderNumber: `BK-${format(orderDate, "yyMMdd")}-${SEED_RUN_ID}-${(1000 + i).toString()}`,
          customerId: customer.id,
          addressId: address.id,
          status,
          fulfilmentType: i % 5 === 0 ? FulfilmentType.PICKUP : FulfilmentType.DELIVERY,
          requestedDate: addDays(orderDate, 1),
          requestedTimeSlot: "13:00-16:00",
          subtotalPaise: subtotal,
          gstPaise: gst,
          packagingPaise: packaging,
          totalPaise: total,
          paymentStatus,
          createdAt: orderDate,
          items: { create: itemsData },
          statusEvents: {
            create: { toStatus: status, actor: "SYSTEM", note: "Seeded order" },
          },
        },
      });

      if (paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.REFUNDED) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            purpose: "ORDER",
            amountPaise: total,
            status: paymentStatus,
            razorpayOrderId: `order_seed_${i}`,
            razorpayPaymentId: `pay_seed_${i}`,
            method: "upi",
          },
        });
      }

      if (status === "OUT_FOR_DELIVERY" || status === "DELIVERED") {
        await prisma.delivery.create({
          data: {
            orderId: order.id,
            provider: "MANUAL",
            riderName: "Ganesh (Porter)",
            riderPhone: "+919876500000",
            status: status === "DELIVERED" ? "DELIVERED" : "OUT_FOR_DELIVERY",
            actualFarePaise: 4500,
            quotedFarePaise: 4500,
          },
        });
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: { totalOrders: { increment: 1 }, lifetimeValuePaise: { increment: total } },
      });
    }

    // Expenses
    const expenseCategories: ExpenseCategory[] = [
      ExpenseCategory.INGREDIENTS, ExpenseCategory.PACKAGING, ExpenseCategory.UTILITIES,
      ExpenseCategory.MARKETING, ExpenseCategory.DELIVERY, ExpenseCategory.OTHER,
    ];
    for (let i = 0; i < EXPENSE_COUNT; i++) {
      await prisma.expense.create({
        data: {
          date: subDays(new Date(), Math.floor(Math.random() * 60)),
          category: expenseCategories[i % expenseCategories.length],
          description: [
            "Chocolate & butter restock", "Packaging boxes (100 units)", "Electricity bill",
            "Instagram ads", "Porter delivery charges", "Gas cylinder refill",
          ][i % 6],
          amountPaise: 50000 + Math.floor(Math.random() * 500000),
        },
      });
    }
  }

  const seededAccounts = [
    { email: adminEmail, name: "Bakery Owner", role: "OWNER", password: adminPassword },
    { email: "manager@bakery.local", name: "Store Manager", role: "MANAGER", password: "Manager@12345" },
    { email: "staff@bakery.local", name: "Kitchen Staff", role: "STAFF", password: "Staff@12345" },
  ];
  for (const acc of seededAccounts) {
    const passwordHash = await hashPassword(acc.password);
    await prisma.adminUser.upsert({
      where: { email: acc.email },
      update: { passwordHash },
      create: { email: acc.email, name: acc.name, role: acc.role, passwordHash },
    });
  }

  console.log("Seed complete.");
  console.log("\nSeeded admin accounts:");
  console.table(seededAccounts.map(({ email, role, password }) => ({ email, role, password })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
