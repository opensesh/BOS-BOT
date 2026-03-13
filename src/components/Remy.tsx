import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ──
const APEROL = "#FE5102";
const CHARCOAL = "#191919";
const GRID = 48;
const CANVAS_PX = 360;
const CELL = CANVAS_PX / GRID;
const DOT_R = CELL * 0.36;

// ── Types ──
type Coord = [number, number];
type DotSet = Set<number>;

export type EmotionKey =
  | "happy" | "neutral" | "sad" | "excited" | "concerned" | "angry"
  | "thinking" | "analyzing" | "confused" | "surprised" | "curious" | "eureka"
  | "listening" | "speaking" | "agreeing" | "disagreeing" | "encouraging" | "empathetic"
  | "suggesting" | "warning" | "celebrating" | "reviewing" | "proud" | "disapproving"
  | "welcome" | "loading" | "error" | "sleeping" | "idle" | "goodbye" | "updating" | "offline";

export type EmotionCategory = "core" | "cog" | "conv" | "adv" | "sys";

interface SequenceFrame {
  dots: DotSet;
  dur: number;
}

interface Category {
  id: EmotionCategory;
  label: string;
  list: EmotionKey[];
}

export interface RemyProps {
  /** Initial emotion to display */
  initialEmotion?: EmotionKey;
  /** Callback when emotion changes */
  onEmotionChange?: (emotion: EmotionKey) => void;
  /** Hide the control panel */
  hideControls?: boolean;
  /** Custom canvas size in pixels (default: 360) */
  size?: number;
  /** Custom className for the container */
  className?: string;
}

export interface RemyRef {
  /** Trigger a specific emotion */
  setEmotion: (emotion: EmotionKey) => void;
  /** Get current emotion */
  getEmotion: () => EmotionKey;
}

// ── Drawing Utilities ──
const dot = (r: number, c: number): number => r * GRID + c;

function fRect(r0: number, c0: number, r1: number, c1: number): Coord[] {
  const d: Coord[] = [];
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++)
      d.push([r, c]);
  return d;
}

function fCirc(cr: number, cc: number, rad: number): Coord[] {
  const d: Coord[] = [];
  for (let r = Math.ceil(cr - rad); r <= Math.floor(cr + rad); r++)
    for (let c = Math.ceil(cc - rad); c <= Math.floor(cc + rad); c++)
      if ((r - cr) ** 2 + (c - cc) ** 2 <= rad * rad + 0.5)
        d.push([r, c]);
  return d;
}

function bline(r0: number, c0: number, r1: number, c1: number): Coord[] {
  const d: Coord[] = [];
  let dx = Math.abs(c1 - c0), dy = Math.abs(r1 - r0);
  let sx = c0 < c1 ? 1 : -1, sy = r0 < r1 ? 1 : -1;
  let e = dx - dy;
  let cr = r0, cc = c0;

  for (;;) {
    d.push([cr, cc]);
    if (cr === r1 && cc === c1) break;
    const e2 = 2 * e;
    if (e2 > -dy) { e -= dy; cc += sx; }
    if (e2 < dx) { e += dx; cr += sy; }
  }
  return d;
}

function eyeOval(cr: number, cc: number, rh: number, rw: number): Coord[] {
  const d: Coord[] = [];
  for (let r = Math.ceil(cr - rh); r <= Math.floor(cr + rh); r++)
    for (let c = Math.ceil(cc - rw); c <= Math.floor(cc + rw); c++)
      if ((r - cr) ** 2 / rh ** 2 + (c - cc) ** 2 / rw ** 2 <= 1.05)
        d.push([r, c]);
  return d;
}

function smileArc(cx: number, cy: number, rx: number, ry: number, startA: number, endA: number, steps = 30): Coord[] {
  const d = new Set<string>();
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps);
    const r = Math.round(cy + ry * Math.sin(a));
    const c = Math.round(cx + rx * Math.cos(a));
    if (r >= 0 && r < GRID && c >= 0 && c < GRID)
      d.add(`${r},${c}`);
  }
  return [...d].map(s => s.split(",").map(Number) as Coord);
}

// Build face with collision-aware FX
function buildFace(eyes: Coord[], mouth: Coord[], brows: Coord[], fx: Coord[] = []): DotSet {
  const featureDots = [...eyes, ...mouth, ...brows];
  const exclusion = new Set<string>();

  for (const [r, c] of featureDots)
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        exclusion.add(`${r + dr},${c + dc}`);

  const safeFx = fx.filter(([r, c]) => !exclusion.has(`${r},${c}`));
  const all = [...featureDots, ...safeFx];

  return new Set(all.map(([r, c]) => dot(r, c)));
}

// ── Layout Constants ──
const ELR = 19, ELC = 13;  // Left eye center
const ERR = 19, ERC = 34;  // Right eye center
const MR = 33, CX = 23;    // Mouth row, center X
const BR = 11;              // Brow row

// ── Eyes ──
const eOpen_l = eyeOval(ELR, ELC, 6, 3.5);
const eOpen_r = eyeOval(ERR, ERC, 6, 3.5);
const eSquint_l = eyeOval(ELR + 1, ELC, 3.5, 3.5);
const eSquint_r = eyeOval(ERR + 1, ERC, 3.5, 3.5);
const eHalf_l = eyeOval(ELR, ELC, 6, 3.5).filter(([r]) => r <= ELR + 1);
const eHalf_r = eyeOval(ERR, ERC, 6, 3.5).filter(([r]) => r <= ERR + 1);
const eClosed_l = fRect(ELR, ELC - 3, ELR + 1, ELC + 3);
const eClosed_r = fRect(ERR, ERC - 3, ERR + 1, ERC + 3);
const eWide_l = eyeOval(ELR - 1, ELC, 7, 4);
const eWide_r = eyeOval(ERR - 1, ERC, 7, 4);
const eX_l = [...bline(ELR - 5, ELC - 3, ELR + 5, ELC + 3), ...bline(ELR - 5, ELC + 3, ELR + 5, ELC - 3)];
const eX_r = [...bline(ERR - 5, ERC - 3, ERR + 5, ERC + 3), ...bline(ERR - 5, ERC + 3, ERR + 5, ERC - 3)];
const eLookup_l = eyeOval(ELR - 2, ELC, 5, 3.5);
const eLookup_r = eyeOval(ERR - 2, ERC, 5, 3.5);
const eSpk_l = eyeOval(ELR, ELC, 6, 3.5);
const eSpk_r = eyeOval(ERR, ERC, 6, 3.5);
const eDim_l = fCirc(ELR, ELC, 1.5);
const eDim_r = fCirc(ERR, ERC, 1.5);
const eFoc_l = eyeOval(ELR + 1, ELC, 3, 3.5);
const eFoc_r = eyeOval(ERR + 1, ERC, 3, 3.5);
const eNarr_l = eyeOval(ELR + 1, ELC, 1.8, 3.5);
const eNarr_r = eyeOval(ERR + 1, ERC, 1.8, 3.5);
const eUnev_l = eyeOval(ELR, ELC, 6, 3.5);
const eUnev_r = eyeOval(ERR + 1, ERC, 3, 3.5);
const eWarm_l = eyeOval(ELR + 0.5, ELC, 5, 3.5);
const eWarm_r = eyeOval(ERR + 0.5, ERC, 5, 3.5);
const eSoft_l = eyeOval(ELR + 0.5, ELC, 4.5, 3.5);
const eSoft_r = eyeOval(ERR + 0.5, ERC, 4.5, 3.5);

// ── Mouths ──
const mWide = smileArc(CX, MR - 3, 8, 5, 0, Math.PI, 50);
const mMed = smileArc(CX, MR - 2, 6, 3, 0, Math.PI, 40);
const mSm = smileArc(CX, MR - 1, 4, 2, 0, Math.PI, 30);
const mSlight = smileArc(CX, MR, 4, 1.5, 0, Math.PI, 30);
const mNeut = fRect(MR, 16, MR + 1, 30);
const mFrSm = smileArc(CX, MR + 1, 4, 2, Math.PI, 2 * Math.PI, 30);
const mFrMd = smileArc(CX, MR + 1, 6, 3, Math.PI, 2 * Math.PI, 40);
const mTight: Coord[] = [...fRect(MR, 16, MR + 1, 30), [MR - 1, 16], [MR - 1, 30]];
const mOpenO = smileArc(CX, MR, 4, 4, 0, 2 * Math.PI, 48);
const mWavy: Coord[] = [[MR, 16], [MR - 1, 18], [MR, 20], [MR - 1, 22], [MR, 24], [MR - 1, 26], [MR, 28], [MR - 1, 30]];
const mGrin = [...smileArc(CX, MR - 3, 8, 5, 0, Math.PI, 50), ...fRect(MR - 2, 16, MR, 30)];
const mPursed = fCirc(MR, CX, 3);
const mJagged: Coord[] = [[MR - 1, 16], [MR, 18], [MR - 1, 20], [MR, 22], [MR - 1, 24], [MR, 26], [MR - 1, 28], [MR, 30]];
const mOpenCl = [...smileArc(CX, MR - 3, 6, 3, 0, Math.PI, 40), ...fRect(MR - 2, 18, MR, 28)];
const mDeterm: Coord[] = [...fRect(MR, 16, MR + 1, 30), [MR - 1, 16], [MR - 1, 30]];
const mSatisf = smileArc(CX, MR - 2, 6, 3, 0, Math.PI, 40);
const mGentle = smileArc(CX, MR - 1, 4, 2, 0, Math.PI, 30);

// ── Brows ──
const bNone: Coord[] = [];
const bRaise = [...fRect(BR, ELC - 4, BR + 1, ELC + 4), ...fRect(BR, ERC - 4, BR + 1, ERC + 4)];
const bFurr = [...bline(BR + 1, ELC - 4, BR - 1, ELC + 4), ...bline(BR + 1, ERC + 4, BR - 1, ERC - 4)];
const bDeep = [...bline(BR + 2, ELC - 4, BR - 2, ELC + 4), ...bline(BR + 2, ERC + 4, BR - 2, ERC - 4)];
const bOneL = [...fRect(BR, ELC - 4, BR + 1, ELC + 4), ...bline(BR + 1, ERC - 4, BR - 1, ERC + 4)];
const bSlF = [...bline(BR + 1, ELC - 4, BR, ELC + 4), ...bline(BR + 1, ERC + 4, BR, ERC - 4)];
const bSlR = [...fRect(BR + 1, ELC - 4, BR + 2, ELC + 4), ...fRect(BR + 1, ERC - 4, BR + 2, ERC + 4)];
const bHigh = [...fRect(BR - 1, ELC - 4, BR, ELC + 4), ...fRect(BR - 1, ERC - 4, BR, ERC + 4)];
const bAngO = [...bline(BR - 1, ELC - 4, BR + 1, ELC + 4), ...bline(BR - 1, ERC + 4, BR + 1, ERC - 4)];
const bMixed = [...fRect(BR, ELC - 4, BR + 1, ELC + 4), ...bline(BR + 2, ERC - 4, BR, ERC + 4)];

// ── FX (Special Effects) ──
const fxSparkle: Coord[] = [[3, 3], [3, 6], [5, 3], [4, 44], [3, 41], [5, 44], [43, 3], [43, 6], [45, 3], [43, 41], [43, 44], [45, 44]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxZzz: Coord[] = [[4, 38], [4, 42], [5, 40], [6, 36], [6, 40], [5, 38], [3, 42], [3, 44]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxEllipsis: Coord[] = [[43, 19], [43, 20], [43, 23], [43, 24], [43, 27], [43, 28]];
const fxExclaim: Coord[] = [[3, 23], [4, 23], [5, 23], [6, 23], [7, 23], [8, 23], [10, 23], [11, 23]];
const fxQuestion: Coord[] = [...bline(3, 36, 6, 39), ...bline(6, 39, 7, 37), [9, 37], [9, 38], [11, 37], [11, 38]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxSweat: Coord[] = [[ELR - 4, ERC + 6], [ELR - 3, ERC + 7], [ELR - 2, ERC + 6], [ELR - 3, ERC + 5]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxLightning: Coord[] = [...bline(3, 3, 7, 7), ...bline(7, 7, 5, 5), ...bline(5, 5, 9, 9)].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxConfetti: Coord[] = [[3, 8], [3, 38], [5, 44], [4, 16], [4, 30], [6, 3], [6, 44], [43, 8], [43, 38], [44, 22]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxTeardrop: Coord[] = [...fCirc(ELR + 9, ELC, 1.5), [ELR + 11, ELC]].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxScan: Coord[] = fRect(MR - 7, 4, MR - 7, 43);
const fxBulb: Coord[] = [...fCirc(4, 42, 3), ...fRect(5, 41, 9, 43), ...fRect(10, 41, 10, 43)].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxBlush: Coord[] = [...fCirc(MR - 5, 5, 2), ...fCirc(MR - 5, 41, 2)].filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxProgress: Coord[] = fRect(45, 3, 45, 30).filter(([r, c]) => r >= 0 && r < GRID && c >= 0 && c < GRID) as Coord[];
const fxLoadRing: Coord[] = (() => {
  const d = new Set<string>();
  for (let a = 0; a < Math.PI * 2; a += 0.14) {
    const r = Math.round(23 + 18 * Math.sin(a));
    const c = Math.round(23 + 18 * Math.cos(a));
    if (r >= 0 && r < GRID && c >= 0 && c < GRID)
      d.add(`${r},${c}`);
  }
  return [...d].map(s => s.split(",").map(Number) as Coord);
})();

// Helper to build expressions
const E = (eyes: Coord[], mouth: Coord[], brows: Coord[], fx: Coord[] = []): DotSet =>
  buildFace(eyes, mouth, brows, fx);

// ── Base Expressions ──
const BASE: Record<EmotionKey, DotSet> = {
  happy: E([...eOpen_l, ...eOpen_r], mWide, bNone, fxSparkle),
  neutral: E([...eOpen_l, ...eOpen_r], mNeut, bNone),
  sad: E([...eHalf_l, ...eHalf_r], mFrSm, bAngO, fxTeardrop),
  excited: E([...eWide_l, ...eWide_r], mGrin, bRaise, fxSparkle),
  concerned: E([...eSquint_l, ...eSquint_r], mWavy, bFurr, fxSweat),
  angry: E([...eFoc_l, ...eFoc_r], mTight, bDeep, fxLightning),
  thinking: E([...eLookup_l, ...eLookup_r], mPursed, bOneL, fxEllipsis),
  analyzing: E([...eFoc_l, ...eFoc_r], mNeut, bSlF, fxScan),
  confused: E([...eUnev_l, ...eUnev_r], mWavy, bMixed, fxQuestion),
  surprised: E([...eWide_l, ...eWide_r], mOpenO, bHigh, fxExclaim),
  curious: E([...eWide_l, ...eWide_r], mSlight, bOneL, fxQuestion),
  eureka: E([...eSpk_l, ...eSpk_r], mMed, bRaise, fxBulb),
  listening: E([...eOpen_l, ...eOpen_r], mSlight, bNone),
  speaking: E([...eOpen_l, ...eOpen_r], mOpenCl, bNone),
  agreeing: E([...eSquint_l, ...eSquint_r], mMed, bNone),
  disagreeing: E([...eOpen_l, ...eOpen_r], mFrSm, bSlF),
  encouraging: E([...eWarm_l, ...eWarm_r], mWide, bSlR, fxSparkle),
  empathetic: E([...eSoft_l, ...eSoft_r], mGentle, bAngO, fxBlush),
  suggesting: E([...eOpen_l, ...eOpen_r], mSlight, bOneL, fxBulb),
  warning: E([...eWide_l, ...eWide_r], mTight, bFurr, fxExclaim),
  celebrating: E([...eWide_l, ...eWide_r], mGrin, bRaise, fxConfetti),
  reviewing: E([...eFoc_l, ...eFoc_r], mPursed, bSlF, fxScan),
  proud: E([...eOpen_l, ...eOpen_r], mSatisf, bNone),
  disapproving: E([...eNarr_l, ...eNarr_r], mFrMd, bDeep),
  welcome: E([...eWarm_l, ...eWarm_r], mMed, bSlR),
  loading: E([...eHalf_l, ...eHalf_r], mNeut, bNone, fxLoadRing),
  error: E([...eX_l, ...eX_r], mJagged, bNone, fxExclaim),
  sleeping: E([...eClosed_l, ...eClosed_r], mGentle, bNone, fxZzz),
  idle: E([...eOpen_l, ...eOpen_r], mNeut, bNone),
  goodbye: E([...eSquint_l, ...eSquint_r], mMed, bNone),
  updating: E([...eHalf_l, ...eHalf_r], mDeterm, bSlF, fxProgress),
  offline: E([...eDim_l, ...eDim_r], [], bNone),
};

// ── Emotion Labels ──
export const EMOTION_LABELS: Record<EmotionKey, string> = {
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  excited: "Excited",
  concerned: "Concerned",
  angry: "Angry",
  thinking: "Thinking",
  analyzing: "Analyzing",
  confused: "Confused",
  surprised: "Surprised",
  curious: "Curious",
  eureka: "Eureka",
  listening: "Listening",
  speaking: "Speaking",
  agreeing: "Agreeing",
  disagreeing: "Disagreeing",
  encouraging: "Encouraging",
  empathetic: "Empathetic",
  suggesting: "Suggesting",
  warning: "Warning",
  celebrating: "Celebrating",
  reviewing: "Reviewing",
  proud: "Proud",
  disapproving: "Disapproving",
  welcome: "Welcome",
  loading: "Loading",
  error: "Error",
  sleeping: "Sleeping",
  idle: "Idle",
  goodbye: "Goodbye",
  updating: "Updating",
  offline: "Offline",
};

// ── Animation Sequences ──
const SEQS: Record<EmotionKey, SequenceFrame[]> = {
  happy: [
    { dots: BASE.happy, dur: 900 },
    { dots: E([...eSquint_l, ...eSquint_r], mGrin, bRaise, fxSparkle), dur: 500 },
    { dots: BASE.happy, dur: 800 },
    { dots: E([...eSquint_l, ...eSquint_r], mMed, bNone), dur: 500 },
    { dots: BASE.happy, dur: 900 },
  ],
  neutral: [
    { dots: BASE.neutral, dur: 1400 },
    { dots: E([...eClosed_l, ...eClosed_r], mNeut, bNone), dur: 180 },
    { dots: BASE.neutral, dur: 1400 },
    { dots: E([...eHalf_l, ...eHalf_r], mNeut, bNone), dur: 380 },
    { dots: BASE.neutral, dur: 1000 },
  ],
  sad: [
    { dots: BASE.sad, dur: 1200 },
    { dots: E([...eHalf_l, ...eHalf_r], mFrMd, bAngO, fxTeardrop), dur: 800 },
    { dots: BASE.sad, dur: 1000 },
    { dots: E([...eClosed_l, ...eClosed_r], mFrSm, bAngO), dur: 600 },
    { dots: BASE.sad, dur: 800 },
  ],
  excited: [
    { dots: BASE.excited, dur: 400 },
    { dots: E([...eWide_l, ...eWide_r], mGrin, bHigh, fxConfetti), dur: 350 },
    { dots: BASE.excited, dur: 380 },
    { dots: E([...eSpk_l, ...eSpk_r], mGrin, bRaise, fxSparkle), dur: 400 },
    { dots: BASE.excited, dur: 400 },
    { dots: E([...eWide_l, ...eWide_r], mGrin, bHigh, fxConfetti), dur: 350 },
    { dots: BASE.excited, dur: 700 },
  ],
  concerned: [
    { dots: BASE.concerned, dur: 800 },
    { dots: E([...eOpen_l, ...eOpen_r], mWavy, bFurr, fxSweat), dur: 600 },
    { dots: BASE.concerned, dur: 700 },
    { dots: E([...eFoc_l, ...eFoc_r], mFrSm, bDeep, fxSweat), dur: 800 },
    { dots: BASE.concerned, dur: 700 },
  ],
  angry: [
    { dots: BASE.angry, dur: 500 },
    { dots: E([...eNarr_l, ...eNarr_r], mTight, bDeep, fxLightning), dur: 280 },
    { dots: BASE.angry, dur: 400 },
    { dots: E([...eNarr_l, ...eNarr_r], mTight, bDeep, fxLightning), dur: 280 },
    { dots: BASE.angry, dur: 600 },
    { dots: E([...eFoc_l, ...eFoc_r], mFrMd, bDeep), dur: 700 },
    { dots: BASE.angry, dur: 700 },
  ],
  thinking: [
    { dots: BASE.thinking, dur: 900 },
    { dots: E([...eLookup_l, ...eLookup_r], mNeut, bOneL, fxEllipsis), dur: 600 },
    { dots: E([...eOpen_l, ...eOpen_r], mPursed, bOneL, fxEllipsis), dur: 700 },
    { dots: BASE.thinking, dur: 700 },
    { dots: E([...eLookup_l, ...eLookup_r], mPursed, bSlF, fxEllipsis), dur: 900 },
    { dots: BASE.thinking, dur: 600 },
  ],
  analyzing: [
    { dots: BASE.analyzing, dur: 500 },
    { dots: E([...eFoc_l, ...eFoc_r], mNeut, bFurr, fxScan), dur: 400 },
    { dots: BASE.analyzing, dur: 500 },
    { dots: E([...eNarr_l, ...eNarr_r], mNeut, bSlF, fxScan), dur: 600 },
    { dots: BASE.analyzing, dur: 600 },
  ],
  confused: [
    { dots: BASE.confused, dur: 800 },
    { dots: E([...eOpen_l, ...eOpen_r], mWavy, bMixed, fxQuestion), dur: 500 },
    { dots: BASE.confused, dur: 700 },
    { dots: E([...eUnev_l, ...eUnev_r], mPursed, bMixed, fxQuestion), dur: 600 },
    { dots: BASE.confused, dur: 700 },
  ],
  surprised: [
    { dots: E([...eOpen_l, ...eOpen_r], mNeut, bNone), dur: 180 },
    { dots: BASE.surprised, dur: 600 },
    { dots: E([...eWide_l, ...eWide_r], mOpenO, bRaise), dur: 500 },
    { dots: BASE.surprised, dur: 800 },
    { dots: E([...eOpen_l, ...eOpen_r], mMed, bSlR), dur: 600 },
  ],
  curious: [
    { dots: BASE.curious, dur: 800 },
    { dots: E([...eWide_l, ...eWide_r], mSlight, bHigh, fxQuestion), dur: 600 },
    { dots: BASE.curious, dur: 700 },
    { dots: E([...eOpen_l, ...eOpen_r], mSlight, bOneL), dur: 700 },
    { dots: BASE.curious, dur: 700 },
  ],
  eureka: [
    { dots: E([...eOpen_l, ...eOpen_r], mNeut, bNone), dur: 300 },
    { dots: E([...eWide_l, ...eWide_r], mOpenO, bHigh, fxExclaim), dur: 380 },
    { dots: BASE.eureka, dur: 500 },
    { dots: E([...eSpk_l, ...eSpk_r], mGrin, bRaise, fxBulb), dur: 600 },
    { dots: BASE.eureka, dur: 600 },
    { dots: E([...eSpk_l, ...eSpk_r], mWide, bRaise, fxSparkle), dur: 700 },
    { dots: BASE.eureka, dur: 600 },
  ],
  listening: [
    { dots: BASE.listening, dur: 900 },
    { dots: E([...eWide_l, ...eWide_r], mSlight, bNone), dur: 500 },
    { dots: BASE.listening, dur: 800 },
    { dots: E([...eSquint_l, ...eSquint_r], mSlight, bNone), dur: 400 },
    { dots: BASE.listening, dur: 800 },
  ],
  speaking: [
    { dots: E([...eOpen_l, ...eOpen_r], mSm, bNone), dur: 260 },
    { dots: BASE.speaking, dur: 260 },
    { dots: E([...eOpen_l, ...eOpen_r], mMed, bNone), dur: 260 },
    { dots: BASE.speaking, dur: 260 },
    { dots: E([...eOpen_l, ...eOpen_r], mSm, bNone), dur: 260 },
    { dots: BASE.speaking, dur: 260 },
    { dots: E([...eOpen_l, ...eOpen_r], mWide, bSlR), dur: 300 },
    { dots: E([...eOpen_l, ...eOpen_r], mMed, bNone), dur: 380 },
  ],
  agreeing: [
    { dots: BASE.agreeing, dur: 600 },
    { dots: E([...eSquint_l, ...eSquint_r], mWide, bRaise), dur: 500 },
    { dots: BASE.agreeing, dur: 500 },
    { dots: E([...eSquint_l, ...eSquint_r], mWide, bRaise), dur: 400 },
    { dots: BASE.agreeing, dur: 700 },
  ],
  disagreeing: [
    { dots: BASE.disagreeing, dur: 800 },
    { dots: E([...eFoc_l, ...eFoc_r], mFrMd, bFurr), dur: 600 },
    { dots: BASE.disagreeing, dur: 700 },
    { dots: E([...eOpen_l, ...eOpen_r], mTight, bSlF), dur: 700 },
    { dots: BASE.disagreeing, dur: 600 },
  ],
  encouraging: [
    { dots: BASE.encouraging, dur: 600 },
    { dots: E([...eSpk_l, ...eSpk_r], mWide, bRaise, fxSparkle), dur: 500 },
    { dots: BASE.encouraging, dur: 500 },
    { dots: E([...eWarm_l, ...eWarm_r], mGrin, bHigh, fxConfetti), dur: 600 },
    { dots: BASE.encouraging, dur: 600 },
  ],
  empathetic: [
    { dots: BASE.empathetic, dur: 1000 },
    { dots: E([...eSoft_l, ...eSoft_r], mSm, bAngO, fxBlush), dur: 700 },
    { dots: BASE.empathetic, dur: 900 },
    { dots: E([...eHalf_l, ...eHalf_r], mGentle, bAngO, fxBlush), dur: 800 },
    { dots: BASE.empathetic, dur: 700 },
  ],
  suggesting: [
    { dots: BASE.suggesting, dur: 800 },
    { dots: E([...eWide_l, ...eWide_r], mMed, bRaise, fxBulb), dur: 600 },
    { dots: BASE.suggesting, dur: 700 },
    { dots: E([...eOpen_l, ...eOpen_r], mWide, bOneL, fxBulb), dur: 700 },
    { dots: BASE.suggesting, dur: 600 },
  ],
  warning: [
    { dots: BASE.warning, dur: 350 },
    { dots: E([...eWide_l, ...eWide_r], mFrSm, bDeep, fxExclaim), dur: 280 },
    { dots: BASE.warning, dur: 350 },
    { dots: E([...eWide_l, ...eWide_r], mFrSm, bDeep, fxExclaim), dur: 280 },
    { dots: BASE.warning, dur: 600 },
    { dots: E([...eFoc_l, ...eFoc_r], mTight, bFurr), dur: 700 },
    { dots: BASE.warning, dur: 500 },
  ],
  celebrating: [
    { dots: BASE.celebrating, dur: 380 },
    { dots: E([...eWide_l, ...eWide_r], mGrin, bHigh, fxConfetti), dur: 320 },
    { dots: BASE.celebrating, dur: 350 },
    { dots: E([...eSpk_l, ...eSpk_r], mWide, bRaise, fxSparkle), dur: 400 },
    { dots: BASE.celebrating, dur: 380 },
    { dots: E([...eWide_l, ...eWide_r], mGrin, bHigh, fxConfetti), dur: 380 },
    { dots: BASE.celebrating, dur: 550 },
  ],
  reviewing: [
    { dots: BASE.reviewing, dur: 600 },
    { dots: E([...eNarr_l, ...eNarr_r], mPursed, bFurr, fxScan), dur: 500 },
    { dots: BASE.reviewing, dur: 600 },
    { dots: E([...eFoc_l, ...eFoc_r], mNeut, bSlF, fxScan), dur: 700 },
    { dots: BASE.reviewing, dur: 600 },
  ],
  proud: [
    { dots: E([...eOpen_l, ...eOpen_r], mMed, bNone), dur: 500 },
    { dots: BASE.proud, dur: 700 },
    { dots: E([...eWarm_l, ...eWarm_r], mWide, bSlR), dur: 600 },
    { dots: BASE.proud, dur: 800 },
    { dots: E([...eSquint_l, ...eSquint_r], mSatisf, bNone), dur: 700 },
    { dots: BASE.proud, dur: 600 },
  ],
  disapproving: [
    { dots: BASE.disapproving, dur: 700 },
    { dots: E([...eFoc_l, ...eFoc_r], mFrMd, bDeep), dur: 600 },
    { dots: BASE.disapproving, dur: 600 },
    { dots: E([...eNarr_l, ...eNarr_r], mTight, bDeep), dur: 700 },
    { dots: BASE.disapproving, dur: 700 },
  ],
  welcome: [
    { dots: E([...eOpen_l, ...eOpen_r], mNeut, bNone), dur: 400 },
    { dots: BASE.welcome, dur: 600 },
    { dots: E([...eSpk_l, ...eSpk_r], mWide, bRaise, fxSparkle), dur: 700 },
    { dots: BASE.welcome, dur: 800 },
    { dots: E([...eWarm_l, ...eWarm_r], mGrin, bSlR), dur: 700 },
    { dots: BASE.welcome, dur: 600 },
  ],
  loading: [
    { dots: BASE.loading, dur: 500 },
    { dots: E([...eClosed_l, ...eClosed_r], mNeut, bNone, fxLoadRing), dur: 400 },
    { dots: BASE.loading, dur: 500 },
    { dots: E([...eClosed_l, ...eClosed_r], mNeut, bNone, fxLoadRing), dur: 400 },
    { dots: BASE.loading, dur: 500 },
    { dots: E([...eHalf_l, ...eHalf_r], mSlight, bNone), dur: 600 },
  ],
  error: [
    { dots: BASE.error, dur: 260 },
    { dots: E([...eOpen_l, ...eOpen_r], mJagged, bNone), dur: 180 },
    { dots: BASE.error, dur: 260 },
    { dots: E([...eOpen_l, ...eOpen_r], mJagged, bNone), dur: 180 },
    { dots: BASE.error, dur: 600 },
    { dots: E([...eFoc_l, ...eFoc_r], mFrSm, bFurr), dur: 700 },
  ],
  sleeping: [
    { dots: BASE.sleeping, dur: 1600 },
    { dots: E([...eClosed_l, ...eClosed_r], mNeut, bNone, fxZzz), dur: 800 },
    { dots: BASE.sleeping, dur: 1600 },
    { dots: E([...eClosed_l, ...eClosed_r], mGentle, bNone), dur: 700 },
    { dots: BASE.sleeping, dur: 1200 },
  ],
  idle: [
    { dots: BASE.idle, dur: 1400 },
    { dots: E([...eClosed_l, ...eClosed_r], mNeut, bNone), dur: 180 },
    { dots: BASE.idle, dur: 1400 },
    { dots: E([...eHalf_l, ...eHalf_r], mNeut, bNone), dur: 350 },
    { dots: BASE.idle, dur: 1200 },
  ],
  goodbye: [
    { dots: E([...eOpen_l, ...eOpen_r], mNeut, bNone), dur: 300 },
    { dots: BASE.goodbye, dur: 600 },
    { dots: E([...eSquint_l, ...eSquint_r], mWide, bRaise, fxSparkle), dur: 700 },
    { dots: BASE.goodbye, dur: 600 },
    { dots: E([...eHalf_l, ...eHalf_r], mSm, bNone), dur: 700 },
  ],
  updating: [
    { dots: BASE.updating, dur: 600 },
    { dots: E([...eFoc_l, ...eFoc_r], mDeterm, bSlF, fxProgress), dur: 500 },
    { dots: BASE.updating, dur: 600 },
    { dots: E([...eHalf_l, ...eHalf_r], mDeterm, bSlF, fxProgress), dur: 700 },
    { dots: BASE.updating, dur: 600 },
  ],
  offline: [
    { dots: BASE.offline, dur: 2000 },
    { dots: E([...eDim_l, ...eDim_r], [], bNone), dur: 200 },
    { dots: BASE.offline, dur: 2000 },
  ],
};

// ── Category Definitions ──
const CATS: Category[] = [
  { id: "core", label: "Core", list: ["happy", "neutral", "sad", "excited", "concerned", "angry"] },
  { id: "cog", label: "Cognitive", list: ["thinking", "analyzing", "confused", "surprised", "curious", "eureka"] },
  { id: "conv", label: "Conversational", list: ["listening", "speaking", "agreeing", "disagreeing", "encouraging", "empathetic"] },
  { id: "adv", label: "Advisory", list: ["suggesting", "warning", "celebrating", "reviewing", "proud", "disapproving"] },
  { id: "sys", label: "System", list: ["welcome", "loading", "error", "sleeping", "idle", "goodbye", "updating", "offline"] },
];

// ── Main Component ──
export default function Remy({
  initialEmotion = "idle",
  onEmotionChange,
  hideControls = false,
  size = CANVAS_PX,
  className,
}: RemyProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [display, setDisplay] = useState<EmotionKey>(initialEmotion);
  const [activeCat, setActiveCat] = useState<EmotionCategory>("core");
  const rafRef = useRef<number | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-dot spring state
  const alphas = useRef(new Float32Array(GRID * GRID).fill(0));
  const targets = useRef(new Float32Array(GRID * GRID).fill(0));
  const vels = useRef(new Float32Array(GRID * GRID).fill(0));
  const stiffs = useRef(new Float32Array(GRID * GRID).fill(0).map(() => 0.10 + Math.random() * 0.12));

  const seqRef = useRef({ key: initialEmotion as EmotionKey, frameIdx: 0, frameStart: 0, isPlaying: false });
  const isError = useRef(false);
  const isOffline = useRef(false);

  const scale = size / CANVAS_PX;

  const setTargets = useCallback((dotSet: DotSet | undefined, emotionKey: EmotionKey) => {
    isError.current = emotionKey === "error";
    isOffline.current = emotionKey === "offline";
    const t = targets.current;
    for (let i = 0; i < GRID * GRID; i++) t[i] = 0;
    if (dotSet) {
      for (const k of dotSet) {
        if (k >= 0 && k < GRID * GRID) t[k] = 1;
      }
    }
  }, []);

  const triggerEmotion = useCallback((key: EmotionKey) => {
    const seq = SEQS[key];
    if (!seq) return;
    setTargets(seq[0].dots, key);
    seqRef.current = { key, frameIdx: 0, frameStart: performance.now(), isPlaying: true };
    setDisplay(key);
    onEmotionChange?.(key);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => triggerEmotion("idle"), 35000);
  }, [setTargets, onEmotionChange]);

  useEffect(() => {
    triggerEmotion("welcome");
    setTimeout(() => triggerEmotion("happy"), 800);
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let last = performance.now();

    function draw(ts: number) {
      if (!ctx) return;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      // Advance sequence
      const sq = seqRef.current;
      if (sq.isPlaying) {
        const frames = SEQS[sq.key];
        const frame = frames?.[sq.frameIdx];
        if (frame && ts - sq.frameStart >= frame.dur) {
          const next = sq.frameIdx + 1;
          if (next < frames.length) {
            setTargets(frames[next].dots, sq.key);
            sq.frameIdx = next;
            sq.frameStart = ts;
          } else {
            sq.isPlaying = false;
            setTargets(BASE.idle, "idle");
            setDisplay("idle");
          }
        }
      }

      // Spring physics per dot
      const a = alphas.current;
      const t = targets.current;
      const v = vels.current;
      const k = stiffs.current;
      const breath = 0.82 + 0.18 * Math.sin(ts / 1900);

      for (let i = 0; i < GRID * GRID; i++) {
        const tgt = t[i];
        const force = k[i] * (tgt - a[i]);
        v[i] = v[i] * 0.78 + force;
        a[i] = Math.max(0, Math.min(1, a[i] + v[i]));
      }

      // Render
      ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
      ctx.fillStyle = CHARCOAL;
      ctx.beginPath();
      ctx.roundRect(0, 0, CANVAS_PX, CANVAS_PX, 18);
      ctx.fill();

      // Scanlines
      for (let sy = 0; sy < CANVAS_PX; sy += 3) {
        ctx.fillStyle = "rgba(0,0,0,0.055)";
        ctx.fillRect(0, sy, CANVAS_PX, 1);
      }

      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const i = r * GRID + c;
          const alpha = a[i];
          const px = (c + 0.5) * CELL;
          const py = (r + 0.5) * CELL;

          if (alpha < 0.015) {
            ctx.fillStyle = "rgba(48,42,34,0.38)";
            ctx.beginPath();
            ctx.arc(px, py, DOT_R * 0.48, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }

          const finalA = alpha * (isOffline.current ? 0.22 : breath);
          const err = isError.current;

          // Glow
          const gl = ctx.createRadialGradient(px, py, 0, px, py, DOT_R * 4.0);
          gl.addColorStop(0, err ? `rgba(255,55,55,${finalA * 0.28})` : `rgba(254,81,2,${finalA * 0.28})`);
          gl.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gl;
          ctx.beginPath();
          ctx.arc(px, py, DOT_R * 4.0, 0, Math.PI * 2);
          ctx.fill();

          // Dot body
          const dg = ctx.createRadialGradient(px - DOT_R * 0.3, py - DOT_R * 0.3, 0, px, py, DOT_R);
          dg.addColorStop(0, err ? `rgba(255,110,110,${finalA})` : `rgba(255,132,58,${finalA})`);
          dg.addColorStop(0.55, err ? `rgba(255,55,55,${finalA})` : `rgba(254,81,2,${finalA})`);
          dg.addColorStop(1, `rgba(130,30,0,${finalA * 0.72})`);
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(px, py, DOT_R, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vignette
      const vg = ctx.createRadialGradient(
        CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.25,
        CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.74
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.roundRect(0, 0, CANVAS_PX, CANVAS_PX, 18);
      ctx.fill();
      ctx.strokeStyle = "#383838";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0.5, 0.5, CANVAS_PX - 1, CANVAS_PX - 1, 18);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setTargets]);

  return (
    <div
      className={className}
      style={{
        background: "#0C0C0C",
        minHeight: hideControls ? "auto" : "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: hideControls ? "16px" : "28px 16px 40px",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {!hideControls && (
        <div style={{ width: "100%", maxWidth: 520, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span style={{ color: APEROL, fontSize: 11, letterSpacing: "0.14em" }}>OPEN SESSION</span>
          <span style={{ color: "#3A3A3A", fontSize: 11, letterSpacing: "0.1em" }}>REMY · BOS 3.0</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_PX}
        height={CANVAS_PX}
        style={{
          display: "block",
          borderRadius: 18,
          marginBottom: hideControls ? 0 : 14,
          width: size,
          height: size,
        }}
      />

      {!hideControls && (
        <>
          <div style={{ color: APEROL, fontSize: 11, letterSpacing: "0.2em", marginBottom: 28, height: 18 }}>
            {EMOTION_LABELS[display]?.toUpperCase()}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {CATS.map(cat => {
              const active = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  style={{
                    background: active ? APEROL : "transparent",
                    color: active ? "#fff" : "#4A4A4A",
                    border: `1px solid ${active ? APEROL : "#272727"}`,
                    borderRadius: 6,
                    padding: "5px 13px",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {cat.label.toUpperCase()}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 500 }}>
            {CATS.find(c => c.id === activeCat)?.list.map(em => {
              const active = display === em;
              return (
                <button
                  key={em}
                  onClick={() => triggerEmotion(em)}
                  style={{
                    background: active ? "#2A1200" : "#141414",
                    color: active ? APEROL : "#555",
                    border: `1px solid ${active ? APEROL : "#222"}`,
                    borderRadius: 7,
                    padding: "8px 16px",
                    fontSize: 11,
                    letterSpacing: "0.07em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minWidth: 96,
                  }}
                >
                  {EMOTION_LABELS[em]}
                </button>
              );
            })}
          </div>

          <div style={{ color: "#222", fontSize: 10, letterSpacing: "0.1em", marginTop: 32 }}>
            PHASE 1 · CLAUDE ARTIFACT · 48×48 DOT MATRIX
          </div>
        </>
      )}
    </div>
  );
}

// Named export for convenience
export { Remy };
