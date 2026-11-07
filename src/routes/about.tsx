import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/storefront";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About us — OSVRYN" }] }),
  component: About,
});

const cards = [
  [
    "Our store",
    "OSVRYN is a small studio making jackets, trackwear and shirts for everyday wear. (Sample text, edit it.)",
  ],
  ["Our mission", "Make well-cut everyday clothing with honest pricing and friendly service."],
  [
    "Our products",
    "Jackets, track sets and heavyweight shirts, chosen for comfort, durability and value.",
  ],
  [
    "Why shop with us",
    "Simple ordering, clear prices, cash on delivery and direct WhatsApp support.",
  ],
];

function About() {
  return (
    <Page title="About OSVRYN">
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(([t, d]) => (
          <div key={t} className="border bg-card p-6 ink-rule">
            <h2 className="display-type text-3xl">{t}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}
