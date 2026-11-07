import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Globe, Minus, Plus, RotateCcw, Search, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import outerwearImage from "@/assets/atelier-outerwear.jpg";
import tracksuitImage from "@/assets/atelier-tracksuit.jpg";
import shirtImage from "@/assets/atelier-shirt.jpg";
import shellImage from "@/assets/atelier-shell.jpg";

type Category = "All pieces" | "Jackets" | "Trackwear" | "Shirts";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  image: string;
  color: string;
  label: string;
};

type CartItem = { product: Product; size: string; quantity: number };

const categories: Category[] = ["All pieces", "Jackets", "Trackwear", "Shirts"];
const sizes = ["S", "M", "L", "XL"];
const products: Product[] = [
  { id: 1, name: "The Form Bomber", category: "Jackets", price: 149, image: outerwearImage, color: "Carbon", label: "Bestseller" },
  { id: 2, name: "Motion Track Set", category: "Trackwear", price: 189, image: tracksuitImage, color: "Pine", label: "Top + bottom set" },
  { id: 3, name: "Structure Shirt", category: "Shirts", price: 79, image: shirtImage, color: "Chalk", label: "Heavyweight cotton" },
  { id: 4, name: "Weather Study Shell", category: "Jackets", price: 169, image: shellImage, color: "Ember", label: "New arrival" },
];

const currencies = {
  USD: { rate: 1, locale: "en-US" },
  EUR: { rate: 0.92, locale: "de-DE" },
  GBP: { rate: 0.79, locale: "en-GB" },
  AED: { rate: 3.67, locale: "en-AE" },
  PKR: { rate: 280, locale: "en-PK" },
} as const;
type CurrencyCode = keyof typeof currencies;
const FREE_SHIPPING_USD = 150;

const perks = [
  { icon: Truck, title: "Worldwide shipping", text: "Tracked delivery to 100+ countries. Free over $150." },
  { icon: RotateCcw, title: "30-day returns", text: "Not the right fit? Send it back, no questions." },
  { icon: ShieldCheck, title: "Secure payments", text: "Cards and wallets, encrypted end to end." },
  { icon: Globe, title: "Prices in your currency", text: "Browse in USD, EUR, GBP, AED or PKR." },
];

const reviews = [
  { name: "Daniel R.", city: "London", text: "The Form Bomber fits like it was cut for me. Heavy enough for autumn, light enough to wear indoors." },
  { name: "Amira K.", city: "Dubai", text: "Fast delivery and the Motion Track Set looks far more expensive than it is." },
  { name: "Lukas M.", city: "Berlin", text: "Clean cut, thick cotton. The Structure Shirt has replaced every other shirt I own." },
];

const faqs = [
  { q: "Do you ship internationally?", a: "Yes. We ship worldwide with tracked delivery. Orders over $150 (or the equivalent) ship free." },
  { q: "How long does delivery take?", a: "Most orders arrive in 5 to 10 business days. You get a tracking link as soon as your order leaves our studio." },
  { q: "What is your return policy?", a: "You have 30 days from delivery to return unworn items in their original condition for a refund or exchange." },
  { q: "How do I find my size?", a: "Our pieces have a regular, relaxed fit. If you are between sizes, choose the smaller size for a closer fit and the larger for a looser one." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OSVRYN | Premium jackets, tracksuits & shirts, shipped worldwide" },
      { name: "description", content: "Premium outerwear, trackwear and shirts designed for everyday movement. Worldwide shipping and 30-day returns." },
      { property: "og:title", content: "OSVRYN | Premium everyday clothing" },
      { property: "og:description", content: "Premium jackets, tracksuits and shirts. Free worldwide shipping over $150." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
});


function Storefront() {
  const [category, setCategory] = useState<Category>("All pieces");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [signupMessage, setSignupMessage] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  function formatPrice(usd: number) {
    const { rate, locale } = currencies[currency];
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(usd * rate);
  }

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatches = category === "All pieces" || product.category === category;
    const searchMatches = `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatches && searchMatches;
  }), [category, query]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const freeShippingLeft = Math.max(0, FREE_SHIPPING_USD - cartTotal);

  function addToCart(product: Product) {
    const size = selectedSizes[product.id] ?? "M";
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return current.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product, size, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: number, size: string, adjustment: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== productId || item.size !== size) return [item];
      const nextQuantity = item.quantity + adjustment;
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
    }));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 bg-foreground px-4 py-2 text-xs font-medium text-primary-foreground sm:px-8">
        <span className="mx-auto pl-16 text-center">Free worldwide shipping on orders over $150</span>
        <label className="flex items-center gap-1.5">
          <Globe className="size-3.5" aria-hidden />
          <span className="sr-only">Currency</span>
          <select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)} className="cursor-pointer bg-transparent text-xs outline-none">
            {Object.keys(currencies).map((code) => <option key={code} value={code} className="text-foreground">{code}</option>)}
          </select>
        </label>
      </div>

      <header className="shop-shell sticky top-0 z-40 flex h-[68px] items-center justify-between border-b bg-background/90 px-4 backdrop-blur ink-rule sm:px-8">
        <nav className="hidden items-center gap-7 md:flex" aria-label="Shop by category">
          {([["Jackets", "Jackets"], ["Trackwear", "Tracksuits"], ["Shirts", "Shirts"]] as const).map(([value, label]) => (
            <a key={value} href="#collection" onClick={() => setCategory(value)} className="text-sm font-medium transition-opacity hover:opacity-60">{label}</a>
          ))}
          <a href="#about" className="text-sm font-medium transition-opacity hover:opacity-60">About</a>
        </nav>

        <a href="#top" className="display-type absolute left-1/2 -translate-x-1/2 text-2xl leading-none tracking-[0.2em]">OSVRYN</a>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={searchOpen ? "Close search" : "Open search"} onClick={() => { setSearchOpen(!searchOpen); setQuery(""); }}>
            {searchOpen ? <X /> : <Search />}
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Open bag, ${cartCount} items`} onClick={() => setCartOpen(true)}>
            <ShoppingBag />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] text-accent-foreground">{cartCount}</span>}
          </Button>
        </div>
      </header>

      {searchOpen && (
        <div className="shop-shell border-b px-4 py-4 ink-rule sm:px-8">
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <div className="flex items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <input id="product-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your next layer" className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
      )}

      <section id="top" className="shop-shell grid grid-cols-1 gap-6 px-4 pb-12 pt-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:pb-16 lg:pt-8">
        <div className="hero-in flex min-h-[380px] flex-col justify-center py-6 lg:min-h-[600px]">
          <p className="text-sm font-medium text-accent">Autumn/Winter collection</p>
          <h1 className="hero-title mt-4 text-[56px] sm:text-[80px] lg:text-[clamp(64px,7.4vw,112px)]">
            Built for<br />everyday<br />movement.
          </h1>
          <p className="mt-6 max-w-[420px] text-base leading-7 text-muted-foreground">
            Premium jackets, tracksuits and shirts, cut clean and made to last. Designed in our studio and shipped to your door anywhere in the world.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-none px-7 text-sm">
              <a href="#collection">Shop the collection <ArrowRight /></a>
            </Button>
            <a href="#about" className="text-sm font-medium underline underline-offset-4">Our story</a>
          </div>
        </div>

        <div className="hero-photo min-h-[440px] lg:min-h-[600px]">
          <img src={outerwearImage} alt="Model wearing the OSVRYN Form Bomber" width={1200} height={1200} fetchPriority="high" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-primary-foreground sm:bottom-6 sm:left-6 sm:right-6">
            <div>
              <p className="text-sm font-medium">Featured</p>
              <p className="display-type mt-1 text-3xl leading-none sm:text-4xl">The Form Bomber</p>
              <p className="mt-1 text-sm opacity-90">From {formatPrice(149)}</p>
            </div>
            <a href="#collection" aria-label="Shop the Form Bomber" className="flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-transform hover:translate-x-1">
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-y bg-secondary" aria-label="Shipping and service">
        <div className="shop-shell grid grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="collection" className="shop-shell px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b pb-5 ink-rule sm:pb-6">
          <div>
            <h2 className="display-type text-4xl leading-none sm:text-5xl">Shop the collection</h2>
            <p className="mt-3 text-sm text-muted-foreground">Jackets, tracksuits and shirts for every season.</p>
          </div>
          <span className="pb-1 text-xs text-muted-foreground">{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}</span>
        </div>

        <div className="flex flex-wrap gap-2 py-5" role="group" aria-label="Filter by clothing type">
          {categories.map((option) => (
            <Button key={option} variant={category === option ? "default" : "outline"} size="sm" className="rounded-full px-5 text-sm" aria-pressed={category === option} onClick={() => setCategory(option)}>
              {option}
            </Button>
          ))}
        </div>

        {visibleProducts.length ? (
          <div className="shop-grid">
            {visibleProducts.map((product) => (
              <article key={product.id} className="min-w-0">
                <div className="product-photo group relative">
                  <img src={product.image} alt={`${product.name} in ${product.color}`} width={1200} height={1200} loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-full bg-background px-3 py-1 text-xs font-medium sm:left-3 sm:top-3">{product.label}</span>
                </div>
                <div className="flex items-start justify-between gap-1 pt-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold sm:text-base">{product.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{product.category}, {product.color}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold sm:text-base">{formatPrice(product.price)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="sr-only" htmlFor={`size-${product.id}`}>Choose size for {product.name}</label>
                  <select id={`size-${product.id}`} value={selectedSizes[product.id] ?? "M"} onChange={(event) => setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))} className="h-10 min-w-0 flex-1 border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {sizes.map((size) => <option key={size} value={size}>Size {size}</option>)}
                  </select>
                  <Button variant="default" className="h-10 flex-1 rounded-none px-2 text-xs sm:text-sm" onClick={() => addToCart(product)}>
                    Add to bag
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">No products match your search. Clear it or pick another category.</div>
        )}
      </section>

      <section id="about" className="bg-foreground text-primary-foreground">
        <div className="shop-shell grid gap-8 px-4 py-14 sm:px-8 sm:py-20 md:grid-cols-2 md:items-center">
          <img src={shellImage} alt="Weather Study Shell in Ember" width={1200} height={1200} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          <div>
            <h2 className="display-type text-4xl leading-none sm:text-5xl">Less noise.<br />More wear.</h2>
            <p className="mt-5 max-w-md text-base leading-7 opacity-80">OSVRYN makes a small range of well-cut essentials. Every piece uses dense fabrics, reinforced seams and a fit that works from the first wear, so you buy less and wear it more.</p>
            <Button asChild variant="outline" className="mt-7 h-12 rounded-none border-primary-foreground/40 bg-transparent px-7 text-sm text-primary-foreground hover:bg-primary-foreground hover:text-foreground">
              <a href="#collection">Shop now</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="shop-shell px-4 py-14 sm:px-8 sm:py-20" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="display-type text-4xl leading-none sm:text-5xl">Worn around the world</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <figure key={review.name} className="border p-6 ink-rule">
              <blockquote className="text-base leading-7">{review.text}</blockquote>
              <figcaption className="mt-5 text-sm text-muted-foreground">{review.name}, {review.city}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="shop-shell grid gap-8 border-t px-4 py-14 ink-rule sm:px-8 sm:py-20 md:grid-cols-[0.8fr_1.2fr]" aria-labelledby="faq-title">
        <h2 id="faq-title" className="display-type text-4xl leading-none sm:text-5xl">Questions, answered</h2>
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t bg-secondary ink-rule">
        <div className="shop-shell grid gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr_1.3fr]">
          <div>
            <a href="#top" className="display-type text-2xl tracking-[0.2em]">OSVRYN</a>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Premium everyday clothing, designed in-house and shipped worldwide.</p>
          </div>
          <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
            <a href="#collection" onClick={() => setCategory("Jackets")} className="hover:underline">Jackets</a>
            <a href="#collection" onClick={() => setCategory("Trackwear")} className="hover:underline">Tracksuits</a>
            <a href="#collection" onClick={() => setCategory("Shirts")} className="hover:underline">Shirts</a>
            <a href="#about" className="hover:underline">About</a>
          </nav>
          <form onSubmit={(event) => { event.preventDefault(); setSignupMessage("Thanks for subscribing. Your first update is on its way."); (event.currentTarget as HTMLFormElement).reset(); }}>
            <label htmlFor="newsletter-email" className="text-sm font-semibold">Get early access to new drops</label>
            <div className="mt-3 flex max-w-md border-b border-foreground">
              <input id="newsletter-email" required type="email" placeholder="Email address" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
              <Button type="submit" variant="ghost" className="text-sm">Subscribe</Button>
            </div>
            <p aria-live="polite" className="mt-2 min-h-5 text-sm text-accent">{signupMessage}</p>
          </form>
        </div>
        <div className="shop-shell flex flex-wrap items-center justify-between gap-2 border-t px-4 py-5 text-xs text-muted-foreground ink-rule sm:px-8">
          <span>© 2026 OSVRYN. All rights reserved.</span><span>Prices shown in {currency}. Currency conversion is an estimate; final charge is in USD.</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <div className="cart-overlay absolute inset-0" />
          <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-background shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="flex items-center justify-between border-b px-5 py-4 ink-rule">
              <div>
                <h2 id="cart-title" className="display-type text-2xl leading-none">Your bag <span className="font-sans text-sm font-normal">({cartCount})</span></h2>
                <p className="mt-2 text-sm text-muted-foreground">{cart.length ? (freeShippingLeft > 0 ? `Add ${formatPrice(freeShippingLeft)} more for free shipping` : "You have free worldwide shipping") : "Free shipping over $150"}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close bag" onClick={() => setCartOpen(false)}><X /></Button>
            </div>
            {cart.length ? (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  {cart.map(({ product, size, quantity }) => (
                    <div key={`${product.id}-${size}`} className="flex gap-4 border-b py-4 ink-rule">
                      <img src={product.image} alt="" width={120} height={120} className="size-24 object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div>
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{product.color}, size {size}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 border">
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, size, -1)}><Minus className="size-3" /></Button>
                            <span className="w-5 text-center text-xs">{quantity}</span>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, size, 1)}><Plus className="size-3" /></Button>
                          </div>
                          <span className="text-xs font-semibold">{formatPrice(product.price * quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-5 ink-rule">
                  <div className="flex justify-between text-sm font-semibold"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Taxes and shipping are calculated at checkout. Online checkout is coming soon.</p>
                  <Button className="mt-4 h-12 w-full rounded-none text-sm" onClick={() => setCartOpen(false)}>Continue shopping</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <ShoppingBag className="size-8 text-muted-foreground" strokeWidth={1} />
                <p className="display-type mt-4 text-2xl">Your bag is empty</p>
                <p className="mt-2 max-w-[240px] text-sm leading-5 text-muted-foreground">Add a piece from the collection to get started.</p>
                <Button className="mt-5 rounded-none px-6 text-sm" onClick={() => setCartOpen(false)}>Browse products</Button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}