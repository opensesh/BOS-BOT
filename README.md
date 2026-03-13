# BOS-BOT

**REMY** — A CRT Tamagotchi-style product avatar for Open Session.

![REMY Avatar](https://img.shields.io/badge/BOS-3.0-FE5102?style=flat-square&labelColor=191919)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![React](https://img.shields.io/badge/react-%3E%3D18.0.0-61dafb?style=flat-square&labelColor=191919)

REMY is a 48×48 dot matrix avatar rendered on HTML Canvas with spring physics animations, CRT-style visual effects, and 32 distinct emotional states. Built for the Open Session ecosystem (BOS 3.0).

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

## Emotion States (32)

REMY supports 32 emotional states organized into 5 categories:

### Core Emotions
| Emotion | Description |
|---------|-------------|
| `happy` | Wide smile with sparkles |
| `neutral` | Default relaxed state |
| `sad` | Downturned expression with teardrop |
| `excited` | Wide eyes, big grin, confetti |
| `concerned` | Squinted eyes, wavy mouth, sweat |
| `angry` | Focused eyes, tight mouth, lightning |

### Cognitive States
| Emotion | Description |
|---------|-------------|
| `thinking` | Looking up, pursed mouth, ellipsis |
| `analyzing` | Focused scan, neutral expression |
| `confused` | Asymmetric eyes, wavy mouth, question mark |
| `surprised` | Wide eyes, open mouth, exclamation |
| `curious` | Wide eyes, slight smile, question mark |
| `eureka` | Spark eyes, smile, lightbulb |

### Conversational States
| Emotion | Description |
|---------|-------------|
| `listening` | Attentive, slight smile |
| `speaking` | Animated mouth movement |
| `agreeing` | Squinted happy eyes, smile |
| `disagreeing` | Open eyes, small frown |
| `encouraging` | Warm eyes, wide smile, sparkles |
| `empathetic` | Soft eyes, gentle smile, blush |

### Advisory States
| Emotion | Description |
|---------|-------------|
| `suggesting` | Open eyes, lightbulb effect |
| `warning` | Wide alert eyes, exclamation |
| `celebrating` | Wide grin, confetti burst |
| `reviewing` | Focused scan expression |
| `proud` | Satisfied warm expression |
| `disapproving` | Narrow eyes, deep frown |

### System States
| Emotion | Description |
|---------|-------------|
| `welcome` | Warm greeting expression |
| `loading` | Half-closed eyes, loading ring |
| `error` | X eyes, jagged mouth, exclamation |
| `sleeping` | Closed eyes, ZZZ effect |
| `idle` | Neutral with occasional blinks |
| `goodbye` | Squinted smile, sparkles |
| `updating` | Half-closed, progress bar |
| `offline` | Dim minimal dots |

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

## Technical Details

- **Grid**: 48×48 dot matrix
- **Animation**: Spring physics with per-dot stiffness variation
- **Effects**: CRT scanlines, radial glow, vignette overlay
- **Performance**: RequestAnimationFrame with delta-time capping
- **Colors**: Aperol (#FE5102) on Charcoal (#191919)

## Brand Context

REMY is the product avatar for **Open Session**, designed as part of the BOS 3.0 design system. The avatar embodies the brand's "warm precision" aesthetic—technical sophistication with approachable character.

## License

MIT © Open Session
