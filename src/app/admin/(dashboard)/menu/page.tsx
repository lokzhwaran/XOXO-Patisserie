import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MenuEditor } from "@/components/admin/menu-editor";
import { CategoryManager } from "@/components/admin/category-manager";
import { Button } from "@/components/ui/button";

export default async function AdminMenuPage() {
  const products = await prisma.product.findMany({
    include: { category: true, capacityDefault: true, _count: { select: { orderItems: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Menu & Inventory</h1>
        <Button asChild variant="outline" size="sm"><Link href="/admin/menu/capacity">Capacity Calendar</Link></Button>
      </div>
      <MenuEditor
        products={products.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          categoryId: p.categoryId,
          sellingPricePaise: p.sellingPricePaise,
          costOfMakingPaise: p.costOfMakingPaise,
          weekdayMax: p.capacityDefault?.weekdayMax ?? 0,
          weekendMax: p.capacityDefault?.weekendMax ?? 0,
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          hasOrders: p._count.orderItems > 0,
        }))}
        categories={categories}
      />
      <section className="flex flex-col gap-3">
        <div><h2 className="font-heading text-xl">Categories</h2><p className="text-sm text-[var(--color-muted-foreground)]">Add, rename, reorder, or hide menu categories.</p></div>
        <CategoryManager categories={categories} />
      </section>
    </div>
  );
}
