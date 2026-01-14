# Payless Cars - Branding & Design System

## 1. Brand Identity

### 1.1 Brand Personality
| Attribute | Description |
|-----------|-------------|
| **Tone** | Professional, trustworthy, modern |
| **Voice** | Clear, direct, helpful |
| **Values** | Transparency, fairness, efficiency |
| **Positioning** | Premium feel with accessible pricing |

### 1.2 Logo Usage
- Primary logo: Text-based "Payless Cars"
- Icon: Stylized car silhouette (for favicon)
- Safe space: Minimum padding equal to height of 'C'

## 2. Color Palette

### 2.1 Light Theme (Default)

#### Primary Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#3f51b5` | `--primary` | CTAs, links, interactive elements |
| Primary Foreground | `#ffffff` | `--primary-foreground` | Text on primary |

#### Secondary Colors (Teal Accents)
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Secondary | `#e0f2f1` | `--secondary` | Subtle backgrounds |
| Secondary Foreground | `#00695c` | `--secondary-foreground` | Accent text |

#### Neutral Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#ffffff` | `--background` | Page background |
| Foreground | `#1a237e` | `--foreground` | Primary text |
| Card | `#ffffff` | `--card` | Card backgrounds |
| Card Foreground | `#212121` | `--card-foreground` | Card text |
| Muted | `#f5f5f5` | `--muted` | Disabled/subtle backgrounds |
| Muted Foreground | `#616161` | `--muted-foreground` | Secondary text |
| Border | `#e0e0e0` | `--border` | Dividers, borders |

#### Semantic Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Destructive | `#f44336` | `--destructive` | Errors, delete actions |
| Accent | `#e8eaf6` | `--accent` | Highlights |
| Accent Foreground | `#1a237e` | `--accent-foreground` | Text on accent |

#### Deal Rating Colors
| Rating | Hex | CSS Variable | Meaning |
|--------|-----|--------------|---------|
| Great Deal | `#00c853` | `--deal-great` | Excellent price |
| Good Deal | `#64dd17` | `--deal-good` | Below market |
| Fair Deal | `#ffd600` | `--deal-fair` | Market price |
| Above Market | `#ff6d00` | `--deal-above` | Slightly high |
| High Price | `#dd2c00` | `--deal-high` | Overpriced |

### 2.2 Dark Theme

#### Primary Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#7986cb` | `--primary` | Lighter for visibility |
| Primary Foreground | `#1a237e` | `--primary-foreground` | Dark text on primary |

#### Secondary Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Secondary | `#1e3a3a` | `--secondary` | Dark teal |
| Secondary Foreground | `#64ffda` | `--secondary-foreground` | Bright accent |

#### Neutral Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background | `#0f172a` | `--background` | Dark background |
| Foreground | `#f8fafc` | `--foreground` | Light text |
| Card | `#1e293b` | `--card` | Elevated surfaces |
| Muted | `#1e293b` | `--muted` | Subtle backgrounds |
| Border | `rgba(255,255,255,0.1)` | `--border` | Subtle dividers |

### 2.3 Chart Colors
| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--chart-1` | `#3f51b5` | `#7986cb` | Primary data |
| `--chart-2` | `#00bfa5` | `#64ffda` | Secondary data |
| `--chart-3` | `#7986cb` | `#9fa8da` | Tertiary data |
| `--chart-4` | `#4db6ac` | `#80cbc4` | Quaternary data |
| `--chart-5` | `#c5cae9` | `#c5cae9` | Background data |

## 3. Typography

### 3.1 Font Families
| Role | Font Family | CSS Variable | Fallbacks |
|------|-------------|--------------|-----------|
| Body | Inter | `--font-sans` | system-ui, -apple-system, sans-serif |
| Display/Headings | Poppins | `--font-display` | system-ui, sans-serif |
| Monospace/Prices | JetBrains Mono | `--font-mono` | monospace |

### 3.2 Type Scale

#### Headings (using `--font-display`)
| Element | Mobile | Tablet+ | Weight | Tracking |
|---------|--------|---------|--------|----------|
| h1 | 2.25rem (36px) | 3rem-3.75rem | 600 | tight |
| h2 | 1.875rem (30px) | 2.25rem | 600 | tight |
| h3 | 1.5rem (24px) | 1.875rem | 600 | tight |
| h4 | 1.25rem (20px) | 1.5rem | 600 | tight |

#### Body Text (using `--font-sans`)
| Style | Size | Weight | Line Height |
|-------|------|--------|-------------|
| Body Large | 1.125rem | 400 | 1.75 |
| Body Regular | 1rem | 400 | 1.5 |
| Body Small | 0.875rem | 400 | 1.5 |
| Caption | 0.75rem | 400 | 1.4 |

#### Prices (using `--font-mono`)
- Font variant: `tabular-nums`
- Weight: 700 (bold)
- Applied via `.price` class

### 3.3 Font Loading
Fonts are loaded via Next.js `next/font` with subset optimization.

## 4. Spacing System

Based on 4px grid with Tailwind's default scale:

| Token | Value | Usage |
|-------|-------|-------|
| 0 | 0px | Reset |
| 1 | 0.25rem (4px) | Tight spacing |
| 2 | 0.5rem (8px) | Small gaps |
| 3 | 0.75rem (12px) | Compact spacing |
| 4 | 1rem (16px) | Standard spacing |
| 6 | 1.5rem (24px) | Section padding |
| 8 | 2rem (32px) | Large gaps |
| 12 | 3rem (48px) | Section spacing |
| 16 | 4rem (64px) | Hero spacing |
| 20 | 5rem (80px) | Major sections |

## 5. Border Radius

| Token | Value | CSS Variable | Usage |
|-------|-------|--------------|-------|
| sm | 0.375rem | `--radius-sm` | Chips, tags |
| md | 0.5rem | `--radius-md` | Buttons, inputs |
| lg | 0.625rem | `--radius-lg` | Cards |
| xl | 1rem | `--radius-xl` | Modals, large cards |
| 2xl | 1.25rem | `--radius-2xl` | Hero sections |
| 3xl | 1.5rem | `--radius-3xl` | Feature cards |
| full | 9999px | - | Circular elements |

Base radius (`--radius`): 0.625rem (10px)

## 6. Shadows

| Name | Value | Usage |
|------|-------|-------|
| `.shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Default card state |
| `.shadow-card-hover` | `0 8px 24px rgba(0,0,0,0.12)` | Hover state |
| `.shadow-dropdown` | `0 4px 16px rgba(0,0,0,0.12)` | Dropdowns, menus |
| `.shadow-modal` | `0 16px 48px rgba(0,0,0,0.2)` | Modal dialogs |

## 7. Button Styles

### 7.1 Primary Button
```css
/* Base */
background: var(--primary);
color: var(--primary-foreground);
padding: 0.5rem 1rem;
border-radius: var(--radius-md);
font-weight: 500;

/* Hover */
filter: brightness(1.1);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

### 7.2 Secondary Button
```css
/* Base */
background: var(--secondary);
color: var(--secondary-foreground);

/* Hover */
background: var(--secondary-foreground);
color: var(--secondary);
```

### 7.3 Ghost Button
```css
/* Base */
background: transparent;
color: var(--foreground);

/* Hover */
background: var(--muted);
```

### 7.4 Destructive Button
```css
/* Base */
background: var(--destructive);
color: white;

/* Hover */
filter: brightness(1.1);
```

### 7.5 Button Sizes
| Size | Padding | Font Size |
|------|---------|-----------|
| sm | 0.25rem 0.5rem | 0.875rem |
| md (default) | 0.5rem 1rem | 1rem |
| lg | 0.75rem 1.5rem | 1.125rem |

## 8. Icon Usage

### 8.1 Icon Library
- **Primary**: Lucide React icons
- **Format**: SVG components
- **Import**: `import { IconName } from 'lucide-react'`

### 8.2 Icon Sizes
| Context | Size | Example |
|---------|------|---------|
| Inline (text) | 16px | Button icons |
| Standard | 20px | Navigation |
| Large | 24px | Feature icons |
| Hero | 48px | Section icons |

### 8.3 Icon Colors
- Inherit text color by default
- Use `currentColor` for stroke
- Specific colors for status icons (success, error, etc.)

## 9. Layout Principles

### 9.1 Container Widths
| Name | Max Width | Padding |
|------|-----------|---------|
| container | 1280px | 1rem (16px) |
| container-sm | 640px | 1rem |
| container-md | 768px | 1rem |
| container-lg | 1024px | 1rem |
| container-xl | 1280px | 1rem |

### 9.2 Grid System
- Based on CSS Grid and Flexbox
- 12-column grid for complex layouts
- Gap utilities: 4, 6, 8 (16px, 24px, 32px)

### 9.3 Responsive Breakpoints
| Name | Min Width | Usage |
|------|-----------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Extra large |

## 10. Animation & Motion

### 10.1 Timing Functions
| Name | Value | Usage |
|------|-------|-------|
| ease-out | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| ease-in | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | State changes |

### 10.2 Duration Scale
| Name | Value | Usage |
|------|-------|-------|
| fast | 150ms | Micro-interactions |
| normal | 200ms | Standard transitions |
| slow | 300ms | Complex animations |
| slower | 500ms | Page transitions |

### 10.3 Animation Classes
| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Fade in (0.5s) |
| `.animate-slide-up` | Slide up + fade (0.5s) |
| `.animate-slide-down` | Slide down + fade (0.3s) |
| `.animate-scale-in` | Scale up + fade (0.2s) |
| `.animate-pulse-slow` | Gentle pulse (3s infinite) |

## 11. Special Effects

### 11.1 Glass Effect
```css
.glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 11.2 Text Gradient
```css
.text-gradient {
    background: linear-gradient(to right, var(--primary), var(--secondary-foreground));
    -webkit-background-clip: text;
    color: transparent;
}
```

### 11.3 Hero Gradient
```css
.bg-hero-gradient {
    background: linear-gradient(to bottom right, 
        #0f172a, 
        #1e1b4b, 
        #0f172a
    );
}
```

## 12. Applying the Design System

### 12.1 CSS Structure
- Global styles: `src/app/globals.css`
- Tailwind config: Uses CSS variables via `@theme inline`
- Component-specific: Inline `className` or CSS modules

### 12.2 Example Component Styling
```tsx
// Primary Button
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md 
                   font-medium hover:brightness-110 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed">
    Start Negotiating
</button>

// Card with Hover
<div className="bg-card text-card-foreground rounded-lg shadow-card 
                hover:shadow-card-hover transition-shadow duration-200 p-6">
    {/* content */}
</div>

// Price Display
<span className="price text-2xl">$35,000</span>
```

### 12.3 Dark Mode
- Trigger: `.dark` class on `<html>` element
- CSS: Uses `@custom-variant dark` in Tailwind
- All colors automatically adjust via CSS variables
