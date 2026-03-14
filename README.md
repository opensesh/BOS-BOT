# BOS-BOT

**REMY** — A Tamagotchi-inspired interactive avatar with CRT emulation.

![BOS 3.0](https://img.shields.io/badge/BOS-3.0-FE5102?style=flat-square&labelColor=191919)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![React](https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb?style=flat-square&labelColor=191919)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-3178c6?style=flat-square&labelColor=191919)

---

## What is Remy?

Remy is the interactive avatar and visual mascot of **BOS** (Brand Operating System). If BOS is the platform, Remy is its face.

Remy manifests as an animated character rendered on a **48×48 high-density dot-matrix grid** with a **CRT-inspired aesthetic**, evoking the warmth and nostalgia of early computing and Tamagotchi-era digital pets.

Remy communicates through **facial expressions and emotional states** rather than words. Its purpose is to:
- **Humanize the platform** — provide a friendly, approachable presence
- **Provide ambient feedback** — reflect system and brand health at a glance
- **Serve as a visual companion** — for AI-driven brand advisory features

---

## Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Nostalgia as Trust** | The 8-bit CRT aesthetic triggers familiarity and emotional warmth. Approachable, not clinical. |
| **Emotion over Interface** | Remy communicates through facial affect, not text. Users read system state at a glance. |
| **Brand-Native** | Built entirely from BOS design tokens — Charcoal, Vanilla, Aperol. The brand in motion. |
| **Scalable Expression** | Composable architecture (eyes, mouth, brows, effects) produces dozens of states from reusable parts. |

---

## Visual Specification

### The Dot Matrix Grid

Remy's face is rendered on a high-density dot-matrix grid simulating an LED panel or CRT phosphor display.

| Property | Specification |
|----------|---------------|
| Grid Dimensions | 48×48 dots |
| Dot Shape | Circular with radial gradient for phosphor glow |
| Container | Rounded rect with 1px warm gray border on Charcoal background |
| Aspect Ratio | 1:1 square |

### Color System

| Element | Color | Notes |
|---------|-------|-------|
| Background | `#191919` (Charcoal) | CRT screen base |
| Active Dots | `#FE5102` (Aperol) | Lit LED dots, primary expression color |
| Active Highlight | `#FF7A38` | Brighter center for emphasis |
| Inactive Dots | `#2D2A26` at 30-40% | Dim phosphor grid, always subtly visible |
| Glow Effect | Aperol at 15-25% | Soft radial bloom around each active dot |

### CRT Effects

- **Phosphor dot glow** — Soft radial gradient per active dot
- **Dim grid visibility** — Inactive dots at low opacity, full grid always perceptible
- **Ambient light bleeding** — Active clusters cast diffused glow
- **Scanline overlay** — Subtle horizontal lines for CRT authenticity
- **Vignette** — Radial darkening at edges simulates CRT curvature

---

## Emotion Taxonomy

Remy supports **32 distinct emotional states** across 5 categories. Each is defined by composable face components (eyes, mouth, brows) and optional ambient effects.

### Core Emotions

| Emotion | Eyes | Mouth | Brows | Effects |
|---------|------|-------|-------|---------|
| **Happy** | Relaxed, squinting | Wide smile | Neutral | Sparkle dots |
| **Neutral** | Open, relaxed | Neutral line | Neutral | Default resting state |
| **Sad** | Half-lidded | Small frown | Angled outward | Teardrop |
| **Excited** | Wide, sparkling | Wide open smile | Raised | Sparkle particles |
| **Concerned** | Slightly squinting | Frown / wavy | Furrowed | Sweat drop |
| **Angry** | Squinting, intense | Tight frown | Deeply furrowed | Lightning |

### Cognitive Emotions

| Emotion | Eyes | Mouth | Brows | Effects |
|---------|------|-------|-------|---------|
| **Thinking** | Looking up/side | Pursed / neutral | One raised | Animated ellipsis (...) |
| **Analyzing** | Focused, narrowed | Neutral line | Slightly furrowed | Scanning line sweep |
| **Confused** | Uneven | Wavy / pursed | Mixed | Question mark |
| **Surprised** | Very wide | Open O | High raised | Exclamation mark |
| **Curious** | Wide, attentive | Slight smile | One raised | Softer question mark |
| **Eureka** | Wide, sparkling | Open smile | Raised | Lightbulb / starburst |

### Conversational Emotions

| Emotion | Eyes | Mouth | Brows | Effects |
|---------|------|-------|-------|---------|
| **Listening** | Open, attentive | Closed, slight smile | Neutral | Subtle eye pulsing |
| **Speaking** | Relaxed | Open/close cycle | Neutral | 2-3 frame mouth cycle |
| **Agreeing** | Happy squint | Smile | Neutral | Gentle nod animation |
| **Disagreeing** | Neutral, steady | Slight frown | Slightly furrowed | Gentle head-shake |
| **Encouraging** | Warm, wide | Wide smile | Slightly raised | Sparkle effects |
| **Empathetic** | Soft, drooping | Gentle smile | Angled outward | Gentle pulsing glow |

### Advisory Emotions

| Emotion | Eyes | Mouth | Brows | Effects |
|---------|------|-------|-------|---------|
| **Suggesting** | Relaxed, aside | Slight smile | One raised | Lightbulb effect |
| **Warning** | Wide, alert | Tight neutral | Furrowed | Exclamation triangle |
| **Celebrating** | Happy, sparkling | Wide grin | Raised | Confetti sparkles |
| **Reviewing** | Focused, narrowed | Neutral pursed | Slightly furrowed | Scanning line |
| **Proud** | Confident | Satisfied smile | Neutral | Warm glow intensifies |
| **Disapproving** | Narrowed, stern | Frown | Furrowed | Subtle head-shake |

### System Emotions

| Emotion | Eyes | Mouth | Brows | Effects |
|---------|------|-------|-------|---------|
| **Welcome** | Wide, warm | Friendly smile | Slightly raised | Dots illuminate center-out |
| **Loading** | Closed / half-lidded | Neutral | None | Cycling dot pattern |
| **Error** | X-shaped / dizzy | Jagged frown | None | Red-shifted glow; flash |
| **Sleeping** | Closed curves | Gentle smile | None | ZZZ floating; slow pulse |
| **Idle** | Relaxed, blinks | Neutral | None | Breathing brightness oscillation |
| **Goodbye** | Happy squint | Smile | None | Dots fade edges-inward |
| **Updating** | Half-lidded | Determined neutral | Slightly furrowed | Progress bar at bottom |
| **Offline** | Dim, barely visible | None | None | Very low opacity; single blink |

---

## Installation

```bash
npm install @opensession/bos-bot
# or
yarn add @opensession/bos-bot
# or
pnpm add @opensession/bos-bot
```

## Quick Start

```tsx
import { Remy } from "@opensession/bos-bot";

function App() {
  return <Remy />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialEmotion` | `EmotionKey` | `"idle"` | Starting emotion state |
| `onEmotionChange` | `(emotion: EmotionKey) => void` | — | Callback when emotion changes |
| `hideControls` | `boolean` | `false` | Hide the interactive control panel |
| `size` | `number` | `360` | Canvas size in pixels |
| `className` | `string` | — | Custom className for container |

## Usage Examples

### Headless Mode (No Controls)

```tsx
import { Remy } from "@opensession/bos-bot";

function Avatar() {
  return (
    <Remy
      hideControls
      size={200}
      initialEmotion="happy"
    />
  );
}
```

### With Emotion Tracking

```tsx
import { Remy, EmotionKey } from "@opensession/bos-bot";

function TrackedAvatar() {
  const handleEmotionChange = (emotion: EmotionKey) => {
    console.log("Current emotion:", emotion);
  };

  return (
    <Remy
      onEmotionChange={handleEmotionChange}
      initialEmotion="welcome"
    />
  );
}
```

---

## Animation System

### Animation Layers

| Layer | Timing | Description |
|-------|--------|-------------|
| Idle Breathing | Continuous, 3-4s | Global brightness oscillation. 10-15% variance. Always active. |
| Micro-animations | Periodic, random | Blinking (3-7s), eye drift, mouth micro-movement. |
| State Transitions | On change, 300-600ms | Smooth dot crossfade. Never abrupt. |
| Effect Animations | State-dependent | Sparkles, ZZZs, scanning lines. Own timing per-emotion. |

### Transition Behavior

- **Crossfade dots** — Old fade out (300ms), new fade in (300ms)
- **Easing** — All transitions ease-in-out, no linear or abrupt transitions
- **Glow persistence** — Ambient glow lags 150ms for warm trailing effect

---

## Technical Details

- **Grid**: 48×48 dot matrix
- **Animation**: Spring physics with per-dot stiffness variation
- **Rendering**: HTML Canvas with requestAnimationFrame
- **Performance**: Target 60fps, <5% CPU when idle
- **Colors**: Aperol (`#FE5102`) on Charcoal (`#191919`)

---

## References & Inspiration

- **Tamagotchi** (Bandai, 1996-2000) — Emotional bond with pixel creature
- **Cozmo Robot** (Anki, 2016) — Minimalist LED eyes conveying complex emotions
- **LED matrix art** — WS2812B/NeoPixel community pixel art faces
- **CRT shaders** — RetroArch CRT-Royale for phosphor glow, scanline, bloom

---

## Documentation

See the full Product Requirements Document: [Remy PRD v1.0](docs/Remy_PRD_v1.pdf)

---

## Brand Context

Remy is the product avatar for **Open Session**, designed as part of the **BOS 3.0** (Brand Operating System) design system. The avatar embodies the brand's "warm precision" aesthetic — technical sophistication with approachable character.

Remy exists at the intersection of three BOS capabilities:
- **Brand Hub** — Reflects brand data health and completeness
- **MCP Server** — State driven by tool usage and integration activity
- **Memory Layer** — Emotional state draws from interaction patterns

---

## License

MIT © Open Session
