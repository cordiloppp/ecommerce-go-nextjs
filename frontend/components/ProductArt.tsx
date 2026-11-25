/**
 * Product illustrations drawn in code: matte devices on a soft stage, one
 * electric-yellow detail each. Used instead of stock photos, which never
 * matched the products. Picks the drawing from the product name or category.
 */

type Kind =
  | "headphones"
  | "keyboard"
  | "mouse"
  | "monitor"
  | "ssd"
  | "webcam"
  | "charger"
  | "speaker"
  | "generic";

const INK = "#1f2937";
const BODY = "#2a3242";
const EDGE = "#3b4556";
const SOFT = "#d0d6df";
const LIGHT = "#f5f7fa";
const VOLT = "#f2c230";

export function kindOf(name: string, category = ""): Kind {
  const s = `${name} ${category}`.toLowerCase();
  if (/aud[ií]fono|auricular|headphone/.test(s)) return "headphones";
  if (/teclado|keyboard/.test(s)) return "keyboard";
  if (/mouse|rat[oó]n/.test(s)) return "mouse";
  if (/monitor|pantalla/.test(s)) return "monitor";
  if (/ssd|nvme|almacenamiento/.test(s)) return "ssd";
  if (/webcam|c[aá]mara|video/.test(s)) return "webcam";
  if (/cargador|charger|usb-c/.test(s)) return "charger";
  if (/bocina|altavoz|speaker/.test(s)) return "speaker";
  return "generic";
}

function Shadow({ cx = 200, cy = 252, rx = 120 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={10} fill="#111827" opacity={0.1} />;
}

function Device({ kind }: { kind: Kind }) {
  switch (kind) {
    case "headphones":
      return (
        <g>
          <Shadow rx={100} />
          <path d="M120 170 C120 80 280 80 280 170" fill="none" stroke={BODY} strokeWidth={16} strokeLinecap="round" />
          <path d="M126 160 C130 98 270 98 274 160" fill="none" stroke={EDGE} strokeWidth={4} strokeLinecap="round" />
          <rect x={96} y={150} width={56} height={92} rx={26} fill={BODY} />
          <rect x={248} y={150} width={56} height={92} rx={26} fill={BODY} />
          <rect x={136} y={160} width={18} height={72} rx={9} fill={EDGE} />
          <rect x={246} y={160} width={18} height={72} rx={9} fill={EDGE} />
          <circle cx={124} cy={226} r={4} fill={VOLT} />
        </g>
      );
    case "keyboard": {
      const keys = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 12; c++) {
          keys.push(
            <rect
              key={`${r}-${c}`}
              x={62 + c * 23.5}
              y={128 + r * 24}
              width={19}
              height={19}
              rx={4}
              fill={r === 0 && c === 0 ? VOLT : EDGE}
            />,
          );
        }
      }
      return (
        <g>
          <Shadow rx={160} cy={240} />
          <rect x={48} y={114} width={304} height={118} rx={14} fill={BODY} />
          {keys}
          <rect x={108} y={214} width={184} height={10} rx={4} fill={EDGE} opacity={0.6} />
        </g>
      );
    }
    case "mouse":
      return (
        <g>
          <Shadow rx={70} />
          <path d="M200 70 C252 70 262 120 262 170 C262 220 236 246 200 246 C164 246 138 220 138 170 C138 120 148 70 200 70 Z" fill={BODY} />
          <path d="M200 72 L200 140" stroke={INK} strokeWidth={3} />
          <rect x={193} y={96} width={14} height={30} rx={7} fill={EDGE} />
          <path d="M146 196 C160 232 240 232 254 196" fill="none" stroke={VOLT} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        </g>
      );
    case "monitor":
      return (
        <g>
          <Shadow rx={90} cy={256} />
          <rect x={186} y={196} width={28} height={46} fill={EDGE} />
          <rect x={140} y={238} width={120} height={12} rx={6} fill={BODY} />
          <rect x={58} y={60} width={284} height={150} rx={10} fill={BODY} />
          <rect x={66} y={68} width={268} height={130} rx={4} fill="#3a4a63" />
          <rect x={66} y={68} width={268} height={130} rx={4} fill="url(#screen)" />
          <circle cx={326} cy={204} r={2.5} fill={VOLT} />
        </g>
      );
    case "ssd":
      return (
        <g>
          <Shadow rx={150} cy={200} />
          <rect x={52} y={140} width={296} height={50} rx={6} fill={INK} />
          <rect x={52} y={140} width={22} height={50} fill="#c9a227" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={54} y={144 + i * 7.5} width={18} height={4} fill={INK} opacity={0.5} />
          ))}
          <rect x={96} y={150} width={64} height={30} rx={3} fill={EDGE} />
          <rect x={172} y={150} width={64} height={30} rx={3} fill={EDGE} />
          <rect x={248} y={150} width={44} height={30} rx={3} fill={EDGE} />
          <circle cx={334} cy={165} r={7} fill="none" stroke={SOFT} strokeWidth={3} />
          <rect x={96} y={150} width={140} height={6} rx={2} fill={VOLT} opacity={0.9} />
        </g>
      );
    case "webcam":
      return (
        <g>
          <Shadow rx={80} cy={250} />
          <path d="M170 196 L150 244 L250 244 L230 196 Z" fill={EDGE} />
          <rect x={92} y={98} width={216} height={100} rx={50} fill={BODY} />
          <circle cx={200} cy={148} r={36} fill={INK} />
          <circle cx={200} cy={148} r={24} fill="#2c3a52" />
          <circle cx={192} cy={140} r={7} fill={LIGHT} opacity={0.35} />
          <circle cx={268} cy={148} r={5} fill={VOLT} />
        </g>
      );
    case "charger":
      return (
        <g>
          <Shadow rx={110} cy={244} />
          <path d="M248 170 C300 170 320 200 344 232" fill="none" stroke={BODY} strokeWidth={8} strokeLinecap="round" />
          <rect x={92} y={96} width={156} height={140} rx={22} fill={BODY} />
          <rect x={232} y={150} width={24} height={14} rx={6} fill={INK} />
          <rect x={232} y={176} width={24} height={14} rx={6} fill={INK} />
          <rect x={120} y={124} width={64} height={6} rx={3} fill={EDGE} />
          <text x={120} y={160} fill={SOFT} fontSize={22} fontFamily="ui-monospace, monospace">100W</text>
          <circle cx={124} cy={208} r={4} fill={VOLT} />
        </g>
      );
    case "speaker": {
      const dots = [];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 9; c++) {
          dots.push(<circle key={`${r}-${c}`} cx={134 + c * 16.5} cy={126 + r * 16} r={3.2} fill={INK} />);
        }
      }
      return (
        <g>
          <Shadow rx={110} cy={250} />
          <rect x={112} y={92} width={176} height={156} rx={40} fill={BODY} />
          {dots}
          <rect x={112} y={222} width={176} height={10} fill={VOLT} opacity={0.9} />
          <rect x={186} y={80} width={28} height={16} rx={6} fill={EDGE} />
        </g>
      );
    }
    default:
      return (
        <g>
          <Shadow rx={90} />
          <rect x={120} y={90} width={160} height={150} rx={20} fill={BODY} />
          <circle cx={200} cy={165} r={22} fill={VOLT} />
        </g>
      );
  }
}

export default function ProductArt({
  name,
  category,
  className = "",
}: {
  name: string;
  category?: string;
  className?: string;
}) {
  const kind = kindOf(name, category);
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={`Ilustración de ${name}`}
      className={`block h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id="stage" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor="#f5f7fa" />
          <stop offset="100%" stopColor="#e3e7ee" />
        </radialGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a6b86" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#1f2937" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={400} height={300} fill="url(#stage)" />
      <Device kind={kind} />
    </svg>
  );
}
