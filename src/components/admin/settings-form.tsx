"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURATED_FONTS, THEME_PRESETS, type ThemeTokens } from "@/lib/theme";
import { TwoFieldListEditor } from "@/components/admin/two-field-list-editor";

interface WhyUsItem { title: string; body: string; }
interface TestimonialItem { name: string; quote: string; }
interface FaqItem { q: string; a: string; }

interface SettingsData {
  businessName: string;
  tagline: string;
  contactEmail: string;
  whatsappNumber: string;
  businessAddress: string;
  fssaiNumber: string;
  gstNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  logoUrl: string;
  heroHeading: string;
  heroSubheading: string;
  heroCtaLabel: string;
  aboutHeading: string;
  aboutCopy: string;
  footerCopy: string;
  whyUsCopy: WhyUsItem[];
  testimonials: TestimonialItem[];
  faq: FaqItem[];
  gstRatePercent: number;
  packagingChargePaise: number;
  minOrderValuePaise: number;
  orderingPausedMessage: string;
  leadTimeHours: number;
  nextAvailableDate: string;
  nextAvailableMessage: string;
  timeSlots: string;
  serviceablePincodes: string;
  deliveryNote: string;
  deliveryBaseChargePaise: number;
  deliveryPerKmChargePaise: number;
  freeDeliveryThresholdPaise: string;
  pickupAddress: string;
  tryAutoDeliveryBooking: boolean;
  razorpayTestMode: boolean;
}

const TABS = ["Branding", "Theme", "Content", "Ordering", "Delivery", "Payments"] as const;
type Tab = (typeof TABS)[number];

export function SettingsForm({
  settings,
  theme,
  razorpayConfigured,
}: {
  settings: SettingsData;
  theme: ThemeTokens;
  razorpayConfigured: boolean;
}) {
  const [tab, setTab] = useState<Tab>("Branding");
  const [form, setForm] = useState(settings);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, theme: currentTheme }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved — changes are live site-wide.");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 font-medium ${tab === t ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "hover:bg-[var(--color-muted)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Branding" && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="businessName">Business name</Label><Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
            <div><Label htmlFor="tagline">Tagline</Label><Input id="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
            <div><Label htmlFor="logoUrl">Logo URL</Label><Input id="logoUrl" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></div>
            <div><Label htmlFor="businessAddress">Business address</Label><Input id="businessAddress" value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} /></div>
            <div><Label htmlFor="fssaiNumber">FSSAI number</Label><Input id="fssaiNumber" value={form.fssaiNumber} onChange={(e) => setForm({ ...form, fssaiNumber: e.target.value })} /></div>
            <div><Label htmlFor="gstNumber">GST number</Label><Input id="gstNumber" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
            <div><Label htmlFor="instagramUrl">Instagram URL</Label><Input id="instagramUrl" value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} /></div>
            <div><Label htmlFor="facebookUrl">Facebook URL</Label><Input id="facebookUrl" value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} /></div>
            <div><Label htmlFor="whatsappNumber">WhatsApp number</Label><Input id="whatsappNumber" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} /></div>
            <div><Label htmlFor="contactEmail">Contact email</Label><Input id="contactEmail" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
          </CardContent>
        </Card>
      )}

      {tab === "Theme" && (
        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(THEME_PRESETS).map(([name, preset]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCurrentTheme(preset)}
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm"
                  style={{ background: preset.colors.background, color: preset.colors.foreground }}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="heading-font">Heading font</Label>
                <select id="heading-font" value={currentTheme.headingFont} onChange={(e) => setCurrentTheme({ ...currentTheme, headingFont: e.target.value })} className="mt-1 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  {CURATED_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="body-font">Body font</Label>
                <select id="body-font" value={currentTheme.bodyFont} onChange={(e) => setCurrentTheme({ ...currentTheme, bodyFont: e.target.value })} className="mt-1 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  {CURATED_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="button-style">Button style</Label>
                <select id="button-style" value={currentTheme.buttonStyle} onChange={(e) => setCurrentTheme({ ...currentTheme, buttonStyle: e.target.value as ThemeTokens["buttonStyle"] })} className="mt-1 w-full rounded-[var(--radius-base)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(currentTheme.colors).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                  <div className="flex items-center gap-2">
                    <input id={`color-${key}`} type="color" value={value} onChange={(e) => setCurrentTheme({ ...currentTheme, colors: { ...currentTheme.colors, [key]: e.target.value } })} className="h-9 w-9 rounded-[var(--radius-base)] border border-[var(--color-border)]" />
                    <span className="text-xs">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Content" && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="grid gap-4">
              <h2 className="font-heading text-lg">Hero</h2>
              <div><Label htmlFor="heroHeading">Hero heading</Label><Input id="heroHeading" value={form.heroHeading} onChange={(e) => setForm({ ...form, heroHeading: e.target.value })} /></div>
              <div><Label htmlFor="heroSubheading">Hero subheading</Label><Textarea id="heroSubheading" value={form.heroSubheading} onChange={(e) => setForm({ ...form, heroSubheading: e.target.value })} /></div>
              <div><Label htmlFor="heroCtaLabel">Hero button label</Label><Input id="heroCtaLabel" value={form.heroCtaLabel} onChange={(e) => setForm({ ...form, heroCtaLabel: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <h2 className="font-heading text-lg">About</h2>
              <div><Label htmlFor="aboutHeading">About heading</Label><Input id="aboutHeading" value={form.aboutHeading} onChange={(e) => setForm({ ...form, aboutHeading: e.target.value })} /></div>
              <div><Label htmlFor="aboutCopy">About copy</Label><Textarea id="aboutCopy" rows={4} value={form.aboutCopy} onChange={(e) => setForm({ ...form, aboutCopy: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3">
              <h2 className="font-heading text-lg">Why us</h2>
              <TwoFieldListEditor items={form.whyUsCopy as unknown as Record<string, string>[]} onChange={(items) => setForm({ ...form, whyUsCopy: items as unknown as WhyUsItem[] })} keyA="title" keyB="body" labelA="Title" labelB="Description" addLabel="Add reason" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3">
              <h2 className="font-heading text-lg">Testimonials</h2>
              <TwoFieldListEditor items={form.testimonials as unknown as Record<string, string>[]} onChange={(items) => setForm({ ...form, testimonials: items as unknown as TestimonialItem[] })} keyA="name" keyB="quote" labelA="Customer name" labelB="Quote" addLabel="Add testimonial" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3">
              <h2 className="font-heading text-lg">FAQ</h2>
              <TwoFieldListEditor items={form.faq as unknown as Record<string, string>[]} onChange={(items) => setForm({ ...form, faq: items as unknown as FaqItem[] })} keyA="q" keyB="a" labelA="Question" labelB="Answer" addLabel="Add question" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4">
              <h2 className="font-heading text-lg">Footer</h2>
              <div><Label htmlFor="footerCopy">Footer copy</Label><Input id="footerCopy" value={form.footerCopy} onChange={(e) => setForm({ ...form, footerCopy: e.target.value })} /></div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "Ordering" && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="gstRatePercent">GST rate (%)</Label><Input id="gstRatePercent" type="number" value={form.gstRatePercent} onChange={(e) => setForm({ ...form, gstRatePercent: Number(e.target.value) })} /></div>
            <div><Label htmlFor="packagingChargePaise">Packaging charge (₹)</Label><Input id="packagingChargePaise" type="number" value={form.packagingChargePaise / 100} onChange={(e) => setForm({ ...form, packagingChargePaise: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label htmlFor="minOrderValuePaise">Minimum order value (₹)</Label><Input id="minOrderValuePaise" type="number" value={form.minOrderValuePaise / 100} onChange={(e) => setForm({ ...form, minOrderValuePaise: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label htmlFor="leadTimeHours">Lead time (hours)</Label><Input id="leadTimeHours" type="number" min="0" value={form.leadTimeHours} onChange={(e) => setForm({ ...form, leadTimeHours: Number(e.target.value) })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="orderingPausedMessage">Ordering paused message</Label><Textarea id="orderingPausedMessage" value={form.orderingPausedMessage} onChange={(e) => setForm({ ...form, orderingPausedMessage: e.target.value })} /></div>
            <div><Label htmlFor="nextAvailableDate">Next available date</Label><Input id="nextAvailableDate" type="date" value={form.nextAvailableDate} onChange={(e) => setForm({ ...form, nextAvailableDate: e.target.value })} /></div>
            <div><Label htmlFor="nextAvailableMessage">Next available message</Label><Input id="nextAvailableMessage" value={form.nextAvailableMessage} onChange={(e) => setForm({ ...form, nextAvailableMessage: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="timeSlots">Time slots (comma-separated)</Label><Input id="timeSlots" value={form.timeSlots} onChange={(e) => setForm({ ...form, timeSlots: e.target.value })} placeholder="10:00-13:00, 13:00-16:00" /></div>
            <div className="sm:col-span-2"><Label htmlFor="serviceablePincodes">Serviceable pincodes (comma-separated)</Label><Textarea id="serviceablePincodes" value={form.serviceablePincodes} onChange={(e) => setForm({ ...form, serviceablePincodes: e.target.value })} placeholder="600001, 600004, 600017" /></div>
          </CardContent>
        </Card>
      )}

      {tab === "Delivery" && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="deliveryBaseChargePaise">Base delivery charge (₹)</Label><Input id="deliveryBaseChargePaise" type="number" value={form.deliveryBaseChargePaise / 100} onChange={(e) => setForm({ ...form, deliveryBaseChargePaise: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label htmlFor="deliveryPerKmChargePaise">Per-km charge (₹)</Label><Input id="deliveryPerKmChargePaise" type="number" value={form.deliveryPerKmChargePaise / 100} onChange={(e) => setForm({ ...form, deliveryPerKmChargePaise: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label htmlFor="freeDeliveryThresholdPaise">Free delivery above (₹, blank = never)</Label><Input id="freeDeliveryThresholdPaise" type="number" value={form.freeDeliveryThresholdPaise} onChange={(e) => setForm({ ...form, freeDeliveryThresholdPaise: e.target.value })} /></div>
            <div><Label htmlFor="pickupAddress">Pickup address</Label><Input id="pickupAddress" value={form.pickupAddress} onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="deliveryNote">Delivery note shown to customers</Label><Textarea id="deliveryNote" value={form.deliveryNote} onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.tryAutoDeliveryBooking} onChange={(e) => setForm({ ...form, tryAutoDeliveryBooking: e.target.checked })} />
              Try automatic booking first (uses Porter if configured, falls back to manual)
            </label>
          </CardContent>
        </Card>
      )}

      {tab === "Payments" && (
        <Card>
          <CardContent className="grid gap-4">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Razorpay keys are set via environment variables, never stored in the database — see <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code>, <code>RAZORPAY_WEBHOOK_SECRET</code>.
              </p>
              <p className="mt-2 text-sm">
                Status: <span className={razorpayConfigured ? "text-[var(--color-success)]" : "text-[var(--color-muted-foreground)]"}>{razorpayConfigured ? "Configured" : "Not configured (sandbox active)"}</span>
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.razorpayTestMode} onChange={(e) => setForm({ ...form, razorpayTestMode: e.target.checked })} />
              Razorpay test mode (turn off only once live keys are set and verified)
            </label>
          </CardContent>
        </Card>
      )}

      <div>
        <Button size="lg" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
