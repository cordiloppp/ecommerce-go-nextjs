import { kindOf } from "@/components/ProductArt";

// Key specs shown as keycaps, taken from each product's own description.
const SPECS: Record<string, string[]> = {
  headphones: ["ANC", "30 h", "Bluetooth"],
  keyboard: ["Switch rojo", "RGB", "Reposamuñecas"],
  mouse: ["16000 DPI", "8 botones"],
  monitor: ['27"', "QHD", "144 Hz", "1 ms"],
  ssd: ["1 TB", "NVMe", "7000 MB/s"],
  webcam: ["4K", "Autoenfoque"],
  charger: ["100 W", "USB-C", "GaN"],
  speaker: ["IPX7", "20 h"],
};

export function specsFor(name: string, category = ""): string[] {
  return SPECS[kindOf(name, category)] ?? [];
}
