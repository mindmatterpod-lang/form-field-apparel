import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Page } from "@/components/storefront";
import { categories, discount, products } from "@/lib/store";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? s["q"] : "",
    cat: typeof s["cat"] === "string" ? s["cat"] : "All",
  }),
  head: () => ({ meta: [{ title: "Shop — OSVRYN" }] }),
  component: () => {
    const s = Route.useSearch();
    return <Shop key={`${s.q}|${s.cat}`} initialQ={s.q} initialCat={s.cat} />;
  },
});

const field = "h-10 border border-input bg-background px-3 text-sm";

function Shop({ initialQ, initialCat }: { initialQ: string; initialCat: string }) {
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState("new");
  const [size, setSize] = useState("");
  const [max, setMax] = useState(0);
  const [sale, setSale] = useState(false);
  const items = useMemo(() => {
    const list = products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        `${p.name} ${p.desc} ${p.category} ${p.color}`.toLowerCase().includes(q.toLowerCase()) &&
        (!sale || discount(p) > 0) &&
        (!size || p.sizes.includes(size)) &&
        (!max || p.price <= max),
    );
    const by = {
      new: (a: (typeof list)[0], b: (typeof list)[0]) => b.created - a.created,
      lo: (a: (typeof list)[0], b: (typeof list)[0]) => a.price - b.price,
      hi: (a: (typeof list)[0], b: (typeof list)[0]) => b.price - a.price,
    }[sort as "new" | "lo" | "hi"];
    return list.sort(by);
  }, [q, cat, sort, size, max, sale]);
  return (
    <Page title="Shop">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          aria-label="Search"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${field} w-full sm:w-56`}
        />
        <select
          aria-label="Category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={field}
        >
          {["All", ...categories].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={field}
        >
          <option value="new">Newest</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
        </select>
        <select
          aria-label="Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className={field}
        >
          <option value="">All sizes</option>
          {["S", "M", "L", "XL"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Max price"
          value={max}
          onChange={(e) => setMax(+e.target.value)}
          className={field}
        >
          {[
            [0, "Any price"],
            [8000, "Under Rs. 8,000"],
            [13000, "Under Rs. 13,000"],
            [16000, "Under Rs. 16,000"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={sale} onChange={(e) => setSale(e.target.checked)} /> Sale
          only
        </label>
      </div>
      <Grid items={items} />
    </Page>
  );
}
