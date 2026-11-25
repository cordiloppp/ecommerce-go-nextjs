// Key specs shown as keycaps, taken from each product's own description.
const SPECS: Record<string, string[]> = {
  "Audífonos Bluetooth Pro": ["ANC", "30 h", "Bluetooth"],
  "Audífonos Inalámbricos Sport": ["IPX5", "8 h", "Estuche"],
  "Audífonos de Estudio Over-Ear": ["50 mm", "Cable desmontable"],
  "Bocina Portátil": ["IPX7", "20 h"],
  "Bocina Bluetooth Mini": ["12 h", "Bluetooth"],
  "Barra de Sonido 2.1": ["2.1", "HDMI ARC"],
  "Teclado Mecánico RGB": ["Switch rojo", "RGB", "Reposamuñecas"],
  "Teclado Compacto 75%": ["75%", "Switch café", "Inalámbrico"],
  "Mouse Gamer 16000 DPI": ["16000 DPI", "8 botones"],
  "Mouse Ergonómico Vertical": ["Vertical", "6 botones"],
  'Monitor 27" 144Hz': ['27"', "QHD", "144 Hz", "1 ms"],
  'Monitor 24" Full HD': ['24"', "Full HD", "75 Hz"],
  'Monitor 32" 4K': ['32"', "4K", "USB-C 65 W"],
  "Brazo para Monitor": ['17–32"', "Resorte de gas"],
  "SSD NVMe 1TB": ["1 TB", "NVMe", "7000 MB/s"],
  "SSD Portátil 2TB": ["2 TB", "1050 MB/s", "USB-C"],
  "Memoria microSD 256GB": ["256 GB", "A2"],
  "Webcam 4K": ["4K", "Autoenfoque"],
  "Webcam Full HD 1080p": ["1080p", "Micrófono"],
  "Cargador USB-C 100W": ["100 W", "USB-C", "GaN"],
  "Cargador Inalámbrico 15W": ["15 W", "Qi"],
  "Hub USB-C 7 en 1": ["7 en 1", "HDMI 4K"],
  "Cable USB-C a USB-C 2 m": ["100 W", "2 m"],
};

export function specsFor(name: string): string[] {
  return SPECS[name] ?? [];
}
