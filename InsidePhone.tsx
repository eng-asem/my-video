import React, {useMemo} from "react";
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from "remotion";
import {getLength, getPointAtLength} from "@remotion/paths";
import {loadFont} from "@remotion/google-fonts/NotoKufiArabic";

/* ------------------------------------------------------------------ *
 *  ماذا يحدث داخل هاتفك عندما تفتح تطبيقًا؟  — 30 ثانية، 30fps، 1920×1080
 *  ستايل: pen plotter (حبر أزرق + قلم أحمر ثانٍ على ورق مربعات)
 *  كل الألوان والسماكات في الثوابت أدناه، عدّلها لتطابق ستايل الريبو.
 * ------------------------------------------------------------------ */

const {fontFamily} = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["arabic", "latin"],
});

const INK = "#14284B"; // القلم الأول
const RED = "#D2362B"; // القلم الثاني
const PAPER = "#F1F4F3";
const GRID = "#D3DCE2";
const W = 1920;
const H = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const prog = (f: number, start: number, dur: number) =>
  interpolate(f, [start, start + dur], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

/* ---------------------------- أشكال مساعدة --------------------------- */

const rr = (x: number, y: number, w: number, h: number, r = 0) =>
  r
    ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
    : `M${x} ${y}H${x + w}V${y + h}H${x}Z`;

const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;

const line = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}`;

/* ------------------------------ المكوّنات ----------------------------- */

// يرسم مسارًا بحركة قلم. p من 0 إلى 1. pen يضيف رأس القلم الأحمر.
const Draw: React.FC<{
  d: string;
  p: number;
  color?: string;
  w?: number;
  pen?: boolean;
  dash?: string; // المسار المتقطع يظهر بالتدرّج بدل الرسم
  fill?: string;
  fillOpacity?: number;
  opacity?: number;
}> = ({d, p, color = INK, w = 4, pen = false, dash, fill = "none", fillOpacity = 0, opacity = 1}) => {
  const len = useMemo(() => getLength(d), [d]);
  const pt = pen && p > 0 && p < 1 ? getPointAtLength(d, len * p) : null;
  const fo = interpolate(p, [0.9, 1], [0, fillOpacity], clamp);
  return (
    <g opacity={opacity}>
      <path
        d={dash ? d : d}
        pathLength={1}
        strokeDasharray={dash ?? "1"}
        strokeDashoffset={dash ? 0 : 1 - p}
        fill={fill}
        fillOpacity={fo}
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={dash ? p : p > 0 ? 1 : 0}
      />
      {pt && (
        <>
          <circle cx={pt.x} cy={pt.y} r={14} fill="none" stroke={RED} strokeWidth={2} opacity={0.5} />
          <circle cx={pt.x} cy={pt.y} r={6} fill={RED} />
        </>
      )}
    </g>
  );
};

const Arrow: React.FC<{
  d: string;
  tip: [number, number];
  dir: 1 | -1;
  p: number;
  color?: string;
}> = ({d, tip, dir, p, color = INK}) => {
  const [x, y] = tip;
  const head = `M${x - dir * 18} ${y - 12}L${x} ${y}L${x - dir * 18} ${y + 12}`;
  return (
    <>
      <Draw d={d} p={Math.min(1, p / 0.85)} color={color} w={4} />
      <Draw d={head} p={interpolate(p, [0.85, 1], [0, 1], clamp)} color={color} w={4} />
    </>
  );
};

const Label: React.FC<{
  x: number;
  y: number;
  p?: number;
  size?: number;
  color?: string;
  weight?: number;
  children: React.ReactNode;
}> = ({x, y, p = 1, size = 40, color = INK, weight = 700, children}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fontFamily={fontFamily}
    fontSize={size}
    fontWeight={weight}
    fill={color}
    opacity={p}
    direction="rtl"
  >
    {children}
  </text>
);

// يكشف النص من اليمين لليسار، كأن القلم يكتبه
const Reveal: React.FC<{p: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  p,
  style,
  children,
}) => (
  <div
    style={{
      display: "inline-block",
      clipPath: `inset(-12px -12px -12px ${(1 - p) * 100}%)`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Caption: React.FC<{children: string}> = ({children}) => {
  const f = useCurrentFrame();
  const p = prog(f, 10, 28);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 835,
        display: "flex",
        justifyContent: "center",
        direction: "rtl",
      }}
    >
      <Reveal
        p={p}
        style={{
          fontFamily,
          fontSize: 52,
          fontWeight: 700,
          color: INK,
          whiteSpace: "nowrap",
          padding: "0 40px",
        }}
      >
        {children}
      </Reveal>
    </div>
  );
};

const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 5, dur - 6, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
    {children}
  </svg>
);

/* ------------------------- الورق + المسطرة الزمنية -------------------- */

const Paper: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
    <defs>
      <pattern id="g1" width={40} height={40} patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke={GRID} strokeWidth={1} />
      </pattern>
      <pattern id="g5" width={200} height={200} patternUnits="userSpaceOnUse">
        <path d="M200 0H0V200" fill="none" stroke={GRID} strokeWidth={2} />
      </pattern>
    </defs>
    <rect width={W} height={H} fill={PAPER} />
    <rect width={W} height={H} fill="url(#g1)" />
    <rect width={W} height={H} fill="url(#g5)" />
    {/* علامات التسجيل في الزوايا */}
    {[
      [60, 60],
      [W - 60, 60],
      [60, H - 60],
      [W - 60, H - 60],
    ].map(([x, y], i) => (
      <path
        key={i}
        d={`M${x - 16} ${y}H${x + 16}M${x} ${y - 16}V${y + 16}`}
        stroke={INK}
        strokeWidth={2}
        opacity={0.45}
      />
    ))}
  </svg>
);

const Ruler: React.FC = () => {
  const f = useCurrentFrame();
  const x0 = 160;
  const x1 = 1760;
  const y = 995;
  const mx = x0 + (f / 900) * (x1 - x0);
  return (
    <svg width={W} height={H} style={{position: "absolute", inset: 0}}>
      <path d={`M${x0} ${y}H${x1}`} stroke={INK} strokeWidth={2} opacity={0.5} />
      {Array.from({length: 31}).map((_, s) => {
        const x = x0 + (s / 30) * (x1 - x0);
        const major = s % 5 === 0;
        return (
          <g key={s} opacity={0.55}>
            <path d={`M${x} ${y}V${y + (major ? 22 : 10)}`} stroke={INK} strokeWidth={2} />
            {major && (
              <text x={x} y={y + 52} textAnchor="middle" fontFamily={fontFamily} fontSize={22} fill={INK}>
                {s}
              </text>
            )}
          </g>
        );
      })}
      <path d={`M${x0} ${y}H${mx}`} stroke={RED} strokeWidth={5} strokeLinecap="round" />
      <circle cx={mx} cy={y} r={9} fill={RED} />
    </svg>
  );
};

/* ================================ المشاهد ============================= */

// 1) اللمس — 0–5 ث
const PHONE = rr(760, 230, 400, 560, 56);

const S1: React.FC = () => {
  const f = useCurrentFrame();
  const title = prog(f, 0, 45);
  return (
    <Scene dur={150}>
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          direction: "rtl",
        }}
      >
        <Reveal p={title} style={{fontFamily, fontSize: 66, fontWeight: 700, color: INK, whiteSpace: "nowrap"}}>
          ماذا يحدث داخل هاتفك عندما تفتح تطبيقًا؟
        </Reveal>
      </div>
      <Svg>
        <Draw d={PHONE} p={prog(f, 0, 40)} w={6} pen />
        <Draw d={line(920, 262, 1000, 262)} p={prog(f, 30, 12)} w={5} />
        {Array.from({length: 12}).map((_, i) => {
          const c = i % 3;
          const r = Math.floor(i / 3);
          const target = i === 4;
          return (
            <Draw
              key={i}
              d={rr(804 + c * 116, 290 + r * 116, 80, 80, 20)}
              p={prog(f, 30 + i * 3, 20)}
              color={target ? RED : INK}
              w={target ? 5 : 3.5}
              fill={RED}
              fillOpacity={target ? 0.15 : 0}
            />
          );
        })}
        {[0, 1, 2].map((i) => {
          const start = 75 + i * 14;
          return (
            <Draw
              key={i}
              d={circ(960, 446, 56 + i * 46)}
              p={prog(f, start, 24)}
              color={RED}
              w={4}
              opacity={interpolate(f, [start + 24, start + 52], [1, 0.2], clamp)}
            />
          );
        })}
      </Svg>
      <Caption>لمسة إصبعك تُحدث تغيّرًا كهربائيًا صغيرًا في الشاشة</Caption>
    </Scene>
  );
};

// 2) نظام التشغيل — 5–10 ث (التدفق من اليمين لليسار)
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const gridLines = [1, 2, 3, 4]
    .map((i) => `M${1300 + 72 * i} 300V660M1300 ${300 + 72 * i}H1660`)
    .join("");
  return (
    <Scene dur={150}>
      <Svg>
        {/* الشاشة + نقطة اللمس */}
        <Draw d={rr(1300, 300, 360, 360, 16)} p={prog(f, 0, 30)} w={5} />
        <Draw d={gridLines} p={prog(f, 5, 30)} w={1.5} opacity={0.5} />
        <Draw d={circ(1480, 480, 14)} p={prog(f, 32, 12)} color={RED} w={4} fill={RED} fillOpacity={1} />
        <Label x={1480} y={720} p={prog(f, 20, 15)} size={38}>الشاشة</Label>
        <Label x={1480} y={768} p={prog(f, 40, 15)} size={28} weight={400} color={INK}>
          x:540  y:1180
        </Label>

        <Arrow d="M1300 470H1160" tip={[1160, 470]} dir={-1} p={prog(f, 42, 20)} />

        {/* نظام التشغيل */}
        <Draw d={rr(760, 350, 400, 240, 20)} p={prog(f, 55, 30)} w={6} pen />
        <Label x={960} y={482} p={prog(f, 80, 15)} size={46}>نظام التشغيل</Label>

        <Arrow d="M760 470H680V560H580" tip={[580, 560]} dir={-1} p={prog(f, 88, 25)} />

        {/* العمليات */}
        <Draw d={rr(260, 290, 320, 90, 14)} p={prog(f, 70, 20)} w={3} dash="10 8" opacity={0.6} />
        <Draw d={rr(260, 400, 320, 90, 14)} p={prog(f, 76, 20)} w={3} dash="10 8" opacity={0.6} />
        <Label x={420} y={346} p={prog(f, 85, 15)} size={30} weight={400}>عملية تعمل</Label>
        <Label x={420} y={456} p={prog(f, 90, 15)} size={30} weight={400}>عملية تعمل</Label>
        <Draw d={rr(260, 510, 320, 100, 14)} p={prog(f, 108, 25)} color={RED} w={5} fill={RED} fillOpacity={0.12} pen />
        <Label x={420} y={573} p={prog(f, 128, 12)} size={40} color={RED}>عملية جديدة</Label>
      </Svg>
      <Caption>النظام يحدد مكان اللمسة ويُنشئ عملية جديدة للتطبيق</Caption>
    </Scene>
  );
};

// 3) التخزين → الذاكرة — 10–16 ث
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const rowY = (i: number) => 350 + i * 54;
  return (
    <Scene dur={180}>
      <Svg>
        <Draw d={rr(1240, 300, 420, 420, 20)} p={prog(f, 0, 35)} w={6} pen />
        <Draw d={rr(260, 300, 420, 420, 20)} p={prog(f, 8, 35)} w={6} />
        <Label x={1450} y={775} p={prog(f, 30, 15)} size={42}>التخزين</Label>
        <Label x={470} y={775} p={prog(f, 38, 15)} size={42}>الذاكرة RAM</Label>

        {Array.from({length: 6}).map((_, i) => {
          const start = 55 + i * 14;
          const dur = 36;
          const t = prog(f, start, dur);
          const bx = interpolate(t, [0, 1], [1280, 540]);
          const moving = f >= start && f < start + dur;
          return (
            <g key={i}>
              {/* مسار الناقل */}
              <Draw d={line(1240, rowY(i) + 22, 680, rowY(i) + 22)} p={prog(f, 40 + i * 3, 15)} w={1.5} dash="6 8" opacity={0.5} />
              {/* صف التخزين */}
              <Draw d={rr(1280, rowY(i), 340, 44, 8)} p={prog(f, 18 + i * 4, 18)} w={3} />
              {/* صف الذاكرة: يمتلئ عند وصول الكتلة */}
              <Draw d={rr(300, rowY(i), 340, 44, 8)} p={prog(f, 26 + i * 4, 15)} w={3} dash="8 6" opacity={0.5} />
              <Draw d={rr(300, rowY(i), 340, 44, 8)} p={prog(f, start + dur, 12)} w={4} fill={INK} fillOpacity={0.18} />
              {moving && (
                <rect x={bx} y={rowY(i)} width={100} height={44} rx={8} fill={RED} opacity={0.9} />
              )}
            </g>
          );
        })}
      </Svg>
      <Caption>الكود ينتقل من التخزين إلى الذاكرة السريعة</Caption>
    </Scene>
  );
};

// 4) المعالج — 16–22 ث
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const pins = Array.from({length: 6})
    .map((_, i) => {
      const a = 350 + i * 60;
      const b = 810 + i * 60;
      return `M760 ${a}H730M1160 ${a}H1190M${b} 300V270M${b} 700V730`;
    })
    .join("");
  const wave =
    "M700 540" +
    Array.from({length: 8})
      .map((_, k) => `V460H${700 - k * 55 - 27.5}V540H${700 - k * 55 - 55}`)
      .join("");
  const cores: [number, number][] = [
    [800, 340],
    [970, 340],
    [800, 510],
    [970, 510],
  ];
  return (
    <Scene dur={180}>
      <Svg>
        {/* الذاكرة */}
        <Draw d={rr(1380, 420, 240, 160, 14)} p={prog(f, 20, 25)} w={5} />
        <Label x={1500} y={512} p={prog(f, 40, 12)} size={40}>RAM</Label>

        {/* الناقل */}
        <Draw d="M1380 470H1190M1380 530H1190" p={prog(f, 45, 20)} w={3} />
        {f > 70 &&
          [0, 1, 2].map((j) => {
            const x = 1380 - ((f * 5 + j * 63) % 190);
            return (
              <g key={j}>
                <circle cx={x} cy={470} r={7} fill={RED} />
                <circle cx={1380 - ((f * 5 + j * 63 + 95) % 190)} cy={530} r={7} fill={RED} />
              </g>
            );
          })}

        {/* الشريحة */}
        <Draw d={rr(760, 300, 400, 400, 24)} p={prog(f, 0, 40)} w={6} pen />
        <Draw d={pins} p={prog(f, 25, 30)} w={4} />
        <Label x={960} y={248} p={prog(f, 30, 12)} size={42}>المعالج</Label>
        {cores.map(([x, y], k) => (
          <g key={k}>
            <Draw
              d={rr(x, y, 150, 150, 16)}
              p={prog(f, 40 + k * 8, 20)}
              w={4}
              color={INK}
            />
            {f > 70 && (
              <rect
                x={x}
                y={y}
                width={150}
                height={150}
                rx={16}
                fill={RED}
                opacity={0.08 + 0.3 * (0.5 + 0.5 * Math.sin(f / 5 + k * 1.6))}
              />
            )}
            <Label x={x + 75} y={y + 86} p={prog(f, 60 + k * 6, 10)} size={32} weight={400}>نواة</Label>
          </g>
        ))}

        {/* إشارة الساعة */}
        <Draw d={wave} p={prog(f, 60, 90)} color={RED} w={4} pen />
        <Label x={480} y={420} p={prog(f, 70, 15)} size={36}>إشارة الساعة</Label>
      </Svg>
      <Caption>المعالج ينفّذ التعليمات بمليارات الدورات في الثانية</Caption>
    </Scene>
  );
};

// 5) الرسوميات — 22–27 ث
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [10, 110], [1, 60], clamp));
  const parts: {d: string; red?: boolean; fill?: boolean}[] = [
    {d: rr(790, 290, 340, 60, 12)},
    {d: rr(790, 370, 340, 190, 12)},
    {d: `${line(790, 370, 1130, 560)}${line(1130, 370, 790, 560)}`},
    {d: `${line(790, 590, 1050, 590)}${line(790, 622, 1100, 622)}${line(790, 654, 980, 654)}`},
    {d: rr(790, 692, 340, 56, 28), red: true, fill: true},
  ];
  return (
    <Scene dur={150}>
      <Svg>
        <Draw d={PHONE} p={prog(f, 0, 25)} w={6} />
        {parts.map((pt, i) => (
          <Draw
            key={i}
            d={pt.d}
            p={prog(f, 20 + i * 18, 20)}
            color={pt.red ? RED : INK}
            w={pt.red ? 5 : 3.5}
            fill={RED}
            fillOpacity={pt.fill ? 0.15 : 0}
            pen
          />
        ))}
        {/* عدّاد الإطارات */}
        <text
          x={400}
          y={500}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={700}
          fontSize={170}
          fill={RED}
          opacity={prog(f, 5, 15)}
        >
          {n}
        </text>
        <Label x={400} y={580} p={prog(f, 20, 15)} size={44}>إطارًا في الثانية</Label>
        {/* إطارات متتالية */}
        {[0, 1, 2].map((i) => (
          <Draw
            key={i}
            d={rr(1360 + i * 40, 330 + i * 30, 170, 290, 26)}
            p={prog(f, 30 + i * 12, 15)}
            w={3}
            dash="9 7"
            opacity={0.8 - i * 0.2}
          />
        ))}
      </Svg>
      <Caption>بطاقة الرسوميات ترسم الواجهة إطارًا بعد إطار</Caption>
    </Scene>
  );
};

// 6) الخاتمة — 27–30 ث
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 960;
  const cy = 330;
  const ra = 84;
  const deg = 0.62 * 360 * prog(f, 20, 35);
  const a0 = (-90 * Math.PI) / 180;
  const a1 = ((-90 + Math.max(deg, 0.01)) * Math.PI) / 180;
  const arc = `M${cx + ra * Math.cos(a0)} ${cy + ra * Math.sin(a0)}A${ra} ${ra} 0 ${deg > 180 ? 1 : 0} 1 ${cx + ra * Math.cos(a1)} ${cy + ra * Math.sin(a1)}`;
  return (
    <Scene dur={90}>
      <Svg>
        <Draw d={circ(cx, cy, 120)} p={prog(f, 0, 25)} w={6} pen />
        <Draw d={rr(935, 172, 50, 18, 6)} p={prog(f, 15, 10)} w={4} />
        <path d={arc} fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round" opacity={deg > 0.5 ? 1 : 0} />
        <Draw d={line(620, 705, 1300, 705)} p={prog(f, 58, 20)} color={RED} w={6} pen />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 545,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          direction: "rtl",
        }}
      >
        <Reveal p={prog(f, 30, 28)} style={{fontFamily, fontSize: 104, fontWeight: 700, color: INK, whiteSpace: "nowrap"}}>
          كل هذا في أقل من ثانية
        </Reveal>
      </div>
    </Scene>
  );
};

/* ================================ التركيب ============================= */

export const InsidePhone: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <Sequence from={0} durationInFrames={150}><S1 /></Sequence>
    <Sequence from={150} durationInFrames={150}><S2 /></Sequence>
    <Sequence from={300} durationInFrames={180}><S3 /></Sequence>
    <Sequence from={480} durationInFrames={180}><S4 /></Sequence>
    <Sequence from={660} durationInFrames={150}><S5 /></Sequence>
    <Sequence from={810} durationInFrames={90}><S6 /></Sequence>
    <Ruler />
  </AbsoluteFill>
);
