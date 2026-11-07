import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCards, Grid, Section, heading } from "@/components/storefront";
import { discount, products } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OSVRYN — Everyday Layers" },
      {
        name: "description",
        content: "Explore considered jackets, trackwear, shirts and everyday layers from OSVRYN.",
      },
      { property: "og:title", content: "OSVRYN — Everyday Layers" },
      { property: "og:description", content: "Considered layers. Made for wherever the day goes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const perks = [
  "Cash on Delivery",
  "Order via WhatsApp",
  "Bank transfer option",
  "Live stock count",
];
const reviews = [
  ["Ayesha", "Fast delivery and lovely quality!"],
  ["Daniel", "Great prices, easy ordering on WhatsApp."],
  ["Maria", "The packaging was beautiful."],
];

function Home() {
  const featured = products.filter((p) => p.featured);
  return (
    <div className="shop-shell px-4 py-6 sm:px-8 sm:py-8">
      <section className="bg-foreground px-6 py-12 text-center text-primary-foreground sm:px-10 md:py-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-70">
          The everyday collection
        </p>
        <h1 className="display-type mt-3 text-6xl leading-[0.9] sm:text-7xl md:text-[110px]">
          MADE FOR
          <br />
          MOVEMENT.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-6 opacity-80">
          Thoughtful layers. Clean lines. Everyday pieces that just feel right.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            variant="secondary"
            className="h-12 rounded-none px-7 text-xs uppercase tracking-[0.1em]"
          >
            <Link to="/shop" search={{ q: "", cat: "All" }}>
              Shop now <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-none border-primary-foreground/40 bg-transparent px-7 text-xs uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary-foreground hover:text-foreground"
          >
            <Link to="/categories">Categories</Link>
          </Button>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {featured.map((p, i) => (
            <Link
              key={p.id}
              to="/product/$id"
              params={{ id: p.id }}
              aria-label={p.name}
              className={`product-photo block transition-transform hover:scale-[1.03] ${i % 2 ? "sm:translate-y-4" : ""}`}
            >
              <img src={p.image} alt={p.name} width={400} height={500} />
            </Link>
          ))}
        </div>
      </section>

      <section
        className="mt-6 grid grid-cols-2 gap-3 text-center text-xs font-semibold uppercase tracking-[0.1em] md:grid-cols-4"
        aria-label="Store values"
      >
        {perks.map((v, i) => (
          <div key={v} className="border bg-card px-2 py-5 ink-rule">
            <span className="mr-2 text-accent">0{i + 1}</span>
            {v}
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className={`${heading} mb-5`}>Shop by category</h2>
        <CategoryCards />
      </section>
      <Section title="Featured products" items={featured} />
      <Section
        title="New arrivals"
        items={[...products].sort((a, b) => b.created - a.created).slice(0, 4)}
      />
      <Section
        title="Best sellers"
        items={[...products].sort((a, b) => b.sold - a.sold).slice(0, 4)}
      />

      <section className="mt-14 border bg-card px-6 py-10 text-center ink-rule">
        <h2 className={heading}>Special offers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Biggest discounts right now</p>
      </section>
      <div className="mt-4">
        <Grid
          items={[...products]
            .filter((p) => discount(p))
            .sort((a, b) => discount(b) - discount(a))
            .slice(0, 4)}
        />
      </div>

      <section className="mt-14">
        <h2 className={`${heading} mb-5`}>What customers say</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map(([name, text]) => (
            <blockquote key={name} className="border bg-card p-5 ink-rule">
              <span className="text-accent">★★★★★</span>
              <p className="mt-2 text-[15px]">{text}</p>
              <footer className="mt-3 text-sm text-muted-foreground">— {name}</footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sample reviews. Replace with real customer feedback.
        </p>
      </section>
      <Newsletter />
    </div>
  );
}

function Newsletter() {
  return (
    <section className="mt-14 border bg-card px-6 py-10 text-center ink-rule">
      <h2 className={heading}>Join our newsletter</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Demo only. No email service is connected, nothing is sent or stored.
      </p>
      <form
        className="mx-auto mt-5 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          f.reset();
          alert("Demo only: nothing was sent.");
        }}
      >
        <label className="sr-only" htmlFor="nl">
          Email
        </label>
        <input
          id="nl"
          required
          type="email"
          placeholder="you@example.com"
          className="h-11 min-w-0 flex-1 border border-input bg-background px-3 text-sm"
        />
        <Button type="submit" className="h-11 rounded-none px-5 text-xs uppercase tracking-[0.1em]">
          Subscribe
        </Button>
      </form>
    </section>
  );
}
