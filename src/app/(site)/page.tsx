import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getHeroImageUrl, getSiteSettings } from "@/lib/site-settings";
import { getFeaturedProducts, getMenuAvailability } from "@/lib/products";
import { FeaturedProductsGrid } from "@/components/featured-products-grid";
import { Button } from "@/components/ui/button";
import { HeroOrderButton } from "@/components/hero-order-button";
import { FaqAccordion } from "@/components/faq-accordion";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { RevealSection } from "@/components/reveal-section";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const featured = await getFeaturedProducts();
  const availability = await getMenuAvailability(featured.map((p) => p.id));

  const whyUs = (settings.whyUsCopy as { title: string; body: string }[] | null) ?? [];
  const faq = (settings.faq as { q: string; a: string }[] | null) ?? [];
  const testimonials = (settings.testimonials as { name: string; quote: string }[] | null) ?? [];
  const heroImageUrl = getHeroImageUrl(settings.heroImageUrl);

  return (
    <div className="pb-16">
      <section className="homepage-hero relative isolate flex min-h-[calc(100svh-5rem)] w-full items-center overflow-hidden bg-[var(--color-background)]">
        <Image
          src={heroImageUrl}
          alt="Freshly baked brownies and cookies from XOXO Patisserie"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/90 to-[var(--color-background)]/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,_rgba(217,138,143,0.16),_transparent_30%)]" />
        <div className="homepage-hero-content relative z-10 mx-auto w-full max-w-(--container-max) px-4 py-12 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl text-[var(--color-foreground)]">
            <span className="eyebrow border-[var(--color-border)] bg-[var(--color-surface)]/70 text-[var(--color-foreground)]">
              XOXO Patisserie · Chennai
            </span>
            <h1 className="mt-4 sm:mt-6 max-w-xl font-heading text-4xl sm:text-6xl lg:text-7xl leading-[1.05] sm:leading-[0.98]">{settings.heroHeading}</h1>
            <p className="mt-4 sm:mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">{settings.heroSubheading}</p>
            <div className="mt-6 sm:mt-8 flex flex-col items-stretch sm:items-center justify-start gap-3 sm:gap-4 sm:flex-row">
              <HeroOrderButton
                label={settings.heroCtaLabel}
                ordersEnabled={settings.ordersEnabled}
                pausedMessage={settings.orderingPausedMessage}
                nextAvailableMessage={settings.nextAvailableMessage}
                whatsappNumber={settings.whatsappNumber}
              />
              <Button asChild variant="outline" size="lg" className="bg-[var(--color-surface)]/65 w-full sm:w-auto">
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </div>
            <div className="mt-8 sm:mt-10 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3 text-left">
              {[
                { label: "Handmade", value: "Small-batch" },
                { label: "Delivery", value: "Chennai" },
                { label: "Freshness", value: "24h" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl sm:rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-surface)]/60 p-2.5 sm:p-4 backdrop-blur-sm">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">{item.label}</div>
                  <div className="mt-1 font-heading text-sm sm:text-xl text-[var(--color-foreground)] font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ChevronDown className="absolute bottom-4 sm:bottom-8 left-1/2 z-10 h-6 w-6 sm:h-8 sm:w-8 -translate-x-1/2 animate-bounce text-[var(--color-accent)]" />
      </section>

      <RevealSection className="mx-auto max-w-(--container-max) px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[calc(var(--radius-base)*2)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:p-3 shadow-[0_20px_60px_rgba(43,29,20,0.06)]">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[calc(var(--radius-base)*1.5)] bg-[var(--color-muted)]">
              {settings.aboutImageUrl ? (
                <Image src={settings.aboutImageUrl} alt="Bakery kitchen" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-accent)]/10" />
              )}
            </div>
          </div>
          <div>
            <span className="eyebrow">Our story</span>
            <h2 className="mt-3 sm:mt-5 font-heading text-2xl sm:text-3xl lg:text-4xl">{settings.aboutHeading}</h2>
            <p className="mt-3 sm:mt-5 text-sm sm:text-base leading-relaxed text-[var(--color-muted-foreground)]">{settings.aboutCopy}</p>
            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: "Baked fresh", value: "Every day" },
                { label: "No preservatives", value: "100%" },
                { label: "Custom gifting", value: "Available" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-2.5 sm:p-4 text-center sm:text-left">
                  <div className="font-heading text-sm sm:text-xl font-semibold text-[var(--color-foreground)]">{stat.value}</div>
                  <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-(--container-max) px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-10 flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow">Bestsellers</span>
            <h2 className="mt-2 sm:mt-4 font-heading text-2xl sm:text-3xl lg:text-4xl">Our most-loved picks</h2>
          </div>
          <Button asChild variant="outline" size="sm" className="inline-flex">
            <Link href="/menu">View all</Link>
          </Button>
        </div>
        <FeaturedProductsGrid
          products={featured.map((p) => ({
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
          }))}
          availability={availability}
          ordersEnabled={settings.ordersEnabled}
          pausedMessage={settings.orderingPausedMessage}
          nextAvailableMessage={settings.nextAvailableMessage}
          whatsappNumber={settings.whatsappNumber}
        />
      </RevealSection>

      <RevealSection className="bg-[var(--color-muted)] py-12 sm:py-20">
        <div className="mx-auto max-w-(--container-max) px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-2 sm:mt-4 font-heading text-2xl sm:text-3xl lg:text-4xl">From craving to delivery</h2>
          </div>
          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
            {["Choose your favourites", "Place your order", "We bake fresh", "Enjoy delivery or pickup"].map((step, i) => (
              <div key={step} className="section-shell rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center flex flex-col items-center">
                <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--color-primary)] font-heading text-base sm:text-lg text-[var(--color-primary-foreground)]">
                  {i + 1}
                </div>
                <p className="font-medium text-xs sm:text-base text-[var(--color-foreground)]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-(--container-max) px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="eyebrow">Why choose us</span>
          <h2 className="mt-2 sm:mt-4 font-heading text-2xl sm:text-3xl lg:text-4xl">Baked with care, every single time</h2>
        </div>
        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {whyUs.map((item) => (
            <div key={item.title} className="section-shell rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center">
              <p className="font-heading text-lg sm:text-xl font-semibold text-[var(--color-foreground)]">{item.title}</p>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.body}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="bg-[var(--color-muted)] py-12 sm:py-20">
        <div className="mx-auto max-w-(--container-max) px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">Testimonials</span>
            <h2 className="mt-2 sm:mt-4 font-heading text-2xl sm:text-3xl lg:text-4xl">Loved by sweet-toothed Chennai</h2>
          </div>
          <div className="mt-8 sm:mt-12">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-3xl px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-2 sm:mt-4 font-heading text-2xl sm:text-3xl lg:text-4xl">Everything you need to know</h2>
        </div>
        <div className="mt-8 sm:mt-10">
          <FaqAccordion items={faq} />
        </div>
      </RevealSection>

      <RevealSection className="bg-[var(--color-foreground)] py-12 sm:py-20 text-[var(--color-background)]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <span className="eyebrow border-white/15 bg-white/5 text-white/80">Treat yourself</span>
          <h2 className="mt-4 sm:mt-5 font-heading text-2xl sm:text-3xl lg:text-4xl">Ready for your next chocolate fix?</h2>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
              <Link href="/menu">{settings.heroCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
