import outerwearImage from "@/assets/atelier-outerwear.jpg";
import tracksuitImage from "@/assets/atelier-tracksuit.jpg";
import shirtImage from "@/assets/atelier-shirt.jpg";
import shellImage from "@/assets/atelier-shell.jpg";

export type Category = "All pieces" | "Jackets" | "Trackwear" | "Shirts";

export type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  /** Original price. Set above `price` to show a discount. */
  oldPrice: number;
  stock: number;
  rating: number;
  sold: number;
  image: string;
  color: string;
  label: string;
  description: string;
};

export type CartItem = { productId: number; size: string; quantity: number };

export type Order = {
  number: string;
  placedAt: string;
  lines: { name: string; size: string; quantity: number; price: number }[];
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
  delivery: number;
  total: number;
};

/**
 * Store settings. Fill these in:
 * - whatsapp: digits with country code, e.g. "923001234567" (enables WhatsApp ordering and chat)
 * - email / phone / address: shown in the Contact section
 */
export const SETTINGS = {
  whatsapp: "",
  deliveryFee: 250,
  email: "hello@osvryn.com",
  phone: "Add your phone number",
  address: "Add your store address",
};

export const categories: Category[] = ["All pieces", "Jackets", "Trackwear", "Shirts"];
export const sizes = ["S", "M", "L", "XL"];
export const chestInches: Record<string, string> = {
  S: "36–38",
  M: "38–40",
  L: "40–42",
  XL: "42–44",
};

export const products: Product[] = [
  {
    id: 1,
    name: "The Form Bomber",
    category: "Jackets",
    price: 12900,
    oldPrice: 0,
    stock: 24,
    rating: 4.8,
    sold: 180,
    image: outerwearImage,
    color: "Carbon",
    label: "THE EVERYDAY ICON",
    description:
      "A clean, structured bomber in carbon. Light lining, ribbed cuffs and a fit that layers over anything.",
  },
  {
    id: 2,
    name: "Motion Track Set",
    category: "Trackwear",
    price: 15900,
    oldPrice: 18900,
    stock: 18,
    rating: 4.7,
    sold: 140,
    image: tracksuitImage,
    color: "Pine",
    label: "SET · TOP + BOTTOM",
    description:
      "A matching zip top and tapered trousers in deep pine. Soft handfeel for gym days and travel days.",
  },
  {
    id: 3,
    name: "Structure Shirt",
    category: "Shirts",
    price: 6900,
    oldPrice: 0,
    stock: 40,
    rating: 4.6,
    sold: 220,
    image: shirtImage,
    color: "Chalk",
    label: "HEAVYWEIGHT COTTON",
    description:
      "Heavyweight cotton shirt with a crisp collar and a relaxed body. Wears well open or buttoned.",
  },
  {
    id: 4,
    name: "Weather Study Shell",
    category: "Jackets",
    price: 14900,
    oldPrice: 17900,
    stock: 9,
    rating: 4.7,
    sold: 95,
    image: shellImage,
    color: "Ember",
    label: "LIGHTWEIGHT LAYER",
    description:
      "A lightweight hooded shell in ember. Wind and shower resistant, and packs down small.",
  },
];

export const reviews = [
  { name: "Ayesha", text: "Fast delivery and lovely quality!" },
  { name: "Daniel", text: "Great prices, easy ordering on WhatsApp." },
  { name: "Maria", text: "The packaging was beautiful." },
];

export const formatPrice = (amount: number) => `Rs. ${amount.toLocaleString("en-PK")}`;
export const discountOf = (p: Product) =>
  p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
export const productById = (id: number) => products.find((p) => p.id === id);
