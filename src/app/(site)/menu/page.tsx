import { getAllActiveProducts, getMenuAvailability } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-settings";
import { MenuClient } from "@/components/menu-client";

export default async function MenuPage() {
  const [products, settings] = await Promise.all([getAllActiveProducts(), getSiteSettings()]);
  const availability = await getMenuAvailability(products.map((p) => p.id));

  const categories = Array.from(
    new Map(products.map((p) => [p.category.id, p.category])).values()
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mx-auto max-w-(--container-max) px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl">Our Menu</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Baked fresh to order — availability shown is for today. Choose your delivery date at checkout.
      </p>
      <MenuClient
        ordersEnabled={settings.ordersEnabled}
        pausedMessage={settings.orderingPausedMessage}
        nextAvailableMessage={settings.nextAvailableMessage}
        whatsappNumber={settings.whatsappNumber}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          slug: p.slug,
          description: p.description,
          images: p.images,
          isVeg: p.isVeg,
          weightGrams: p.weightGrams,
          sellingPricePaise: p.sellingPricePaise,
          isFeatured: p.isFeatured,
          categoryId: p.categoryId,
          categoryName: p.category.name,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        availability={availability}
      />
    </div>
  );
}
