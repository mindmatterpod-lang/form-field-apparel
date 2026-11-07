import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/storefront";
import { SETTINGS, useStore } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact us — OSVRYN" }] }),
  component: Contact,
});

const input = "mt-1 w-full border border-input bg-background px-3 py-2 text-sm font-normal";

function Contact() {
  const { whatsapp } = useStore();
  return (
    <Page title="Contact us">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 border bg-card p-6 text-sm ink-rule">
          <p>
            Email:{" "}
            <a className="underline" href={`mailto:${SETTINGS.email}`}>
              {SETTINGS.email}
            </a>
          </p>
          <p>Phone: {SETTINGS.phone}</p>
          <p>Address: {SETTINGS.address}</p>
          <Button
            className="rounded-none text-xs uppercase tracking-[0.1em]"
            onClick={() => whatsapp()}
          >
            Chat on WhatsApp
          </Button>
        </div>
        <form
          className="space-y-3 border bg-card p-6 ink-rule"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            location.href = `mailto:${SETTINGS.email}?subject=${encodeURIComponent("Message from " + d.get("name"))}&body=${encodeURIComponent(`${d.get("message")}\n\n${d.get("name")} (${d.get("email")})`)}`;
          }}
        >
          <p className="text-xs text-muted-foreground">
            This opens your email app with the message ready to send.
          </p>
          <label className="block text-sm font-semibold">
            Name
            <input name="name" required className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Message
            <textarea name="message" required rows={4} className={input} />
          </label>
          <Button type="submit" className="rounded-none text-xs uppercase tracking-[0.1em]">
            Send message
          </Button>
        </form>
      </div>
    </Page>
  );
}
