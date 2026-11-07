import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/storefront";
import { SETTINGS, findProduct, money, useStore, type Order } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — OSVRYN" }] }),
  component: Checkout,
});

const input = "mt-1 w-full border border-input bg-background px-3 py-2 text-sm font-normal";

function Checkout() {
  const { cart, subtotal, clear, saveOrder, whatsapp, notify } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lines = cart.flatMap((l) => {
    const p = findProduct(l.id);
    return p ? [{ name: p.name, size: l.size, qty: l.qty, price: p.price }] : [];
  });
  const total = subtotal + SETTINGS.deliveryFee;
  if (!cart.length)
    return (
      <Page>
        <p>
          Your cart is empty.{" "}
          <Link className="underline" to="/shop" search={{ q: "", cat: "All" }}>
            Shop now
          </Link>
        </p>
      </Page>
    );

  function read(form: HTMLFormElement) {
    const d = new FormData(form),
      g = (k: string) => String(d.get(k) ?? "").trim(),
      missing: string[] = [];
    if (g("name").length < 2) missing.push("full name");
    if (!/^[+\d][\d\s-]{6,}$/.test(g("phone"))) missing.push("a valid phone number");
    if (g("email") && !/^\S+@\S+\.\S+$/.test(g("email"))) missing.push("a valid email");
    if (!g("city")) missing.push("city");
    if (g("address").length < 5) missing.push("delivery address");
    if (missing.length) {
      setError(`Please provide: ${missing.join(", ")}.`);
      notify("Please fix the form", true);
      return null;
    }
    setError("");
    return {
      name: g("name"),
      phone: g("phone"),
      email: g("email"),
      city: g("city"),
      address: g("address"),
      note: g("note"),
      payment: g("payment"),
    };
  }
  const place = (form: HTMLFormElement) => {
    const customer = read(form);
    if (!customer) return;
    setBusy(true);
    const order: Order = {
      no: `ORD-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleString(),
      lines,
      customer,
      subtotal,
      fee: SETTINGS.deliveryFee,
      total,
    };
    saveOrder(order);
    clear();
    navigate({ to: "/confirm/$no", params: { no: order.no } });
  };
  const sendWhatsApp = (form: HTMLFormElement) => {
    const c = read(form);
    if (!c) return;
    whatsapp(
      `New order — OSVRYN\n\n${lines.map((l) => `• ${l.name} (${l.size}) x${l.qty} = ${money(l.price * l.qty)}`).join("\n")}\n\nSubtotal: ${money(subtotal)}\nDelivery: ${money(SETTINGS.deliveryFee)}\nTotal: ${money(total)}\nPayment: ${c.payment}\n\nName: ${c.name}\nPhone: ${c.phone}\nCity: ${c.city}\nAddress: ${c.address}${c.note ? `\nNote: ${c.note}` : ""}`,
    );
  };
  return (
    <Page title="Checkout">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          place(e.currentTarget);
        }}
        className="grid gap-6 md:grid-cols-3"
      >
        <div className="space-y-3 border bg-card p-5 ink-rule md:col-span-2">
          <p className="text-xs text-muted-foreground">
            Online checkout is not connected yet. Orders are saved only in this browser. Use “Order
            on WhatsApp” to send your order to the store.
          </p>
          <label className="block text-sm font-semibold">
            Full name *<input name="name" autoComplete="name" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Phone number *<input name="phone" type="tel" autoComplete="tel" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Email (optional)
            <input name="email" type="email" autoComplete="email" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            City *<input name="city" autoComplete="address-level2" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Complete delivery address *<textarea name="address" rows={2} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Additional instructions
            <textarea name="note" rows={2} className={input} />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Payment</legend>
            <label className="mt-1 block text-sm">
              <input type="radio" name="payment" value="Cash on Delivery" defaultChecked /> Cash on
              Delivery
            </label>
            <label className="block text-sm">
              <input type="radio" name="payment" value="Bank transfer (arranged manually)" /> Bank
              transfer (manual arrangement only)
            </label>
          </fieldset>
          <p role="alert" className="min-h-5 text-sm text-destructive">
            {error}
          </p>
        </div>
        <aside className="h-fit border bg-card p-5 ink-rule">
          <b className="text-sm">Order summary</b>
          <div className="mt-2 space-y-1">
            {lines.map((l) => (
              <div key={`${l.name}-${l.size}`} className="flex justify-between gap-2 text-sm">
                <span>
                  {l.name} · {l.size} × {l.qty}
                </span>
                <span>{money(l.price * l.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-sm ink-rule">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <span>{money(SETTINGS.deliveryFee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-lg">
            <b>Total</b>
            <b>{money(total)}</b>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="mt-4 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
          >
            {busy ? "Placing order…" : "Place order"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-11 w-full rounded-none text-xs uppercase tracking-[0.1em]"
            onClick={(e) => sendWhatsApp(e.currentTarget.form!)}
          >
            Order on WhatsApp
          </Button>
        </aside>
      </form>
    </Page>
  );
}
