import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import outerwearImage from "@/assets/atelier-outerwear.jpg";
import tracksuitImage from "@/assets/atelier-tracksuit.jpg";
import shirtImage from "@/assets/atelier-shirt.jpg";
import shellImage from "@/assets/atelier-shell.jpg";

export const categories = ["Jackets", "Trackwear", "Shirts"] as const;
export type Category = (typeof categories)[number];
export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  old: number;
  stock: number;
  image: string;
  color: string;
  label: string;
  sizes: string[];
  rating: number;
  sold: number;
  featured: boolean;
  desc: string;
  created: number;
};
export type CartLine = { id: string; size: string; qty: number };
export type Order = {
  no: string;
  date: string;
  lines: { name: string; size: string; qty: number; price: number }[];
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    note: string;
    payment: string;
  };
  subtotal: number;
  fee: number;
  total: number;
};

/** Store settings. Add the WhatsApp number (digits with country code, e.g. 923001234567) to enable WhatsApp ordering. */
export const SETTINGS = {
  whatsapp: "",
  deliveryFee: 250,
  email: "hello@osvryn.com",
  phone: "Add phone number",
  address: "Add store address",
};
const SIZES = ["S", "M", "L", "XL"];

export const products: Product[] = [
  {
    id: "form-bomber",
    name: "The Form Bomber",
    category: "Jackets",
    price: 12900,
    old: 0,
    stock: 24,
    image: outerwearImage,
    color: "Carbon",
    label: "THE EVERYDAY ICON",
    sizes: SIZES,
    rating: 4.8,
    sold: 180,
    featured: true,
    created: 4,
    desc: "A clean, structured bomber in carbon. Light lining, ribbed cuffs and a fit that layers over anything.",
  },
  {
    id: "motion-track-set",
    name: "Motion Track Set",
    category: "Trackwear",
    price: 15900,
    old: 18900,
    stock: 18,
    image: tracksuitImage,
    color: "Pine",
    label: "SET · TOP + BOTTOM",
    sizes: SIZES,
    rating: 4.7,
    sold: 140,
    featured: true,
    created: 3,
    desc: "A matching zip top and tapered trousers in deep pine. Soft handfeel, made for gym days and travel days.",
  },
  {
    id: "structure-shirt",
    name: "Structure Shirt",
    category: "Shirts",
    price: 6900,
    old: 0,
    stock: 40,
    image: shirtImage,
    color: "Chalk",
    label: "HEAVYWEIGHT COTTON",
    sizes: SIZES,
    rating: 4.6,
    sold: 220,
    featured: true,
    created: 2,
    desc: "Heavyweight cotton shirt with a crisp collar and a relaxed body. Wears well open or buttoned.",
  },
  {
    id: "weather-shell",
    name: "Weather Study Shell",
    category: "Jackets",
    price: 14900,
    old: 17900,
    stock: 9,
    image: shellImage,
    color: "Ember",
    label: "LIGHTWEIGHT LAYER",
    sizes: SIZES,
    rating: 4.7,
    sold: 95,
    featured: true,
    created: 5,
    desc: "A lightweight hooded shell in ember. Wind and shower resistant, packs small.",
  },
];

export const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
export const discount = (p: Product) =>
  p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
export const findProduct = (id: string) => products.find((p) => p.id === id);

type Ctx = {
  cart: CartLine[];
  wish: string[];
  toast: { text: string; error: boolean } | null;
  count: number;
  subtotal: number;
  notify: (text: string, error?: boolean) => void;
  add: (id: string, qty?: number, size?: string) => void;
  setQty: (index: number, delta: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
  saveOrder: (o: Order) => void;
  getOrder: (no: string) => Order | undefined;
  whatsapp: (text?: string) => void;
};
const StoreContext = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreContext);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<Ctx["toast"]>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setCart(load("osvryn_cart", []));
    setWish(load("osvryn_wish", []));
    setOrders(load("osvryn_orders", []));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("osvryn_cart", JSON.stringify(cart));
      localStorage.setItem("osvryn_wish", JSON.stringify(wish));
      localStorage.setItem("osvryn_orders", JSON.stringify(orders));
    } catch {
      /* storage blocked */
    }
  }, [cart, wish, orders, ready]);

  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  const inCart = (id: string, lines = cart) =>
    lines.filter((l) => l.id === id).reduce((a, l) => a + l.qty, 0);

  const add: Ctx["add"] = (id, qty = 1, size = "M") => {
    const p = findProduct(id);
    if (!p || p.stock < 1) return notify("Out of stock", true);
    if (inCart(id) + qty > p.stock) return notify(`Only ${p.stock} in stock`, true);
    setCart((c) => {
      const f = c.find((l) => l.id === id && l.size === size);
      return f
        ? c.map((l) => (l === f ? { ...l, qty: l.qty + qty } : l))
        : [...c, { id, size, qty }];
    });
    notify(`${p.name} added to cart`);
  };
  const setQty: Ctx["setQty"] = (i, d) => {
    const l = cart[i],
      p = l && findProduct(l.id);
    if (!l || !p) return;
    if (l.qty + d < 1) return setCart((c) => c.filter((_, k) => k !== i));
    if (inCart(l.id) + d > p.stock) return notify(`Only ${p.stock} in stock`, true);
    setCart((c) => c.map((x, k) => (k === i ? { ...x, qty: x.qty + d } : x)));
  };
  const toggleWish = (id: string) => {
    const has = wish.includes(id);
    setWish(has ? wish.filter((w) => w !== id) : [...wish, id]);
    notify(has ? "Removed from wishlist" : "Saved to wishlist");
  };
  const whatsapp = (text?: string) => {
    const n = SETTINGS.whatsapp.replace(/\D/g, "");
    if (n.length < 7)
      return notify("WhatsApp number not set yet. Add it in src/lib/store.tsx (SETTINGS).", true);
    window.open(
      `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
      "_blank",
      "noopener",
    );
  };
  const value: Ctx = {
    cart,
    wish,
    toast,
    notify,
    add,
    setQty,
    whatsapp,
    toggleWish,
    count: cart.reduce((a, l) => a + l.qty, 0),
    subtotal: cart.reduce((a, l) => a + l.qty * (findProduct(l.id)?.price ?? 0), 0),
    remove: (i) => setCart((c) => c.filter((_, k) => k !== i)),
    clear: () => setCart([]),
    saveOrder: (o) => setOrders((x) => [o, ...x]),
    getOrder: (no) => orders.find((o) => o.no === no),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
