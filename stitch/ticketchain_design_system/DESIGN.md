---
name: TicketChain Design System
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#debfc0'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#a58a8b'
  outline-variant: '#574142'
  surface-tint: '#ffb2b7'
  primary: '#ffb2b7'
  on-primary: '#67001b'
  primary-container: '#7d1128'
  on-primary-container: '#ff8591'
  inverse-primary: '#a93445'
  secondary: '#f0bf6b'
  on-secondary: '#422c00'
  secondary-container: '#714e00'
  on-secondary-container: '#f4c26e'
  tertiary: '#ffb3b5'
  on-tertiary: '#620f1c'
  tertiary-container: '#751e28'
  on-tertiary-container: '#fd878d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b7'
  on-primary-fixed: '#40000e'
  on-primary-fixed-variant: '#881b2f'
  secondary-fixed: '#ffdeab'
  secondary-fixed-dim: '#f0bf6b'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b5'
  on-tertiary-fixed: '#40000b'
  on-tertiary-fixed-variant: '#802730'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-xl:
    fontFamily: Syne
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-lg: 4rem
  stack-md: 2rem
  stack-sm: 1rem
---

## Brand & Style
The design system for this decentralized ticketing platform is built upon the pillars of **Exclusivity, Security, and Fluidity**. It targets a high-end demographic of event-goers and organizers who value the prestige of luxury events combined with the cutting-edge reliability of blockchain technology.

The visual style is **Premium Minimalist with Tactile Depth**. It blends the structural precision of high-end SaaS (Stripe/Linear) with the atmospheric elegance of luxury editorial design. Key characteristics include:
- **Atmospheric Layering:** Using light and shadow to create a sense of physical space.
- **Subtle Glassmorphism:** Employing frosted surfaces for navigation and secondary overlays to maintain context.
- **Venture-Backed Polish:** High-contrast typography paired with generous white space and micro-interactions that feel expensive and deliberate.

## Colors
The palette is rooted in a "Luxury Noir" aesthetic for dark mode and "Warm Heritage" for light mode.

- **Primary Sequence:** Deep Maroon (#5C0A18) provides the foundation, Royal Burgundy (#7D1128) serves as the interactive primary, and Wine Red (#9A1F3C) is used for highlights and hover states.
- **Accents:** Luxury Gold and Champagne Gold are reserved for premium indicators, "sold out" statuses, or VIP tier branding. They should be used sparingly to maintain their value.
- **Functional Neutrals:** In Dark Mode, the background is Rich Black (#0F0F10) with Charcoal (#1A1A1D) surfaces. In Light Mode, the Warm Cream (#F7F2EB) background creates a softer, more inviting canvas than pure white.

## Typography
The typography system uses a tri-font strategy to balance character with utility.

- **Display & Headlines:** *Syne* (substituted for Clash) provides a bold, wide-set, and confident geometric presence that feels architectural.
- **Subheadings & UI Elements:** *Sora* is used for navigation, buttons, and secondary titles. Its distinct curves ensure UI elements remain approachable despite the serious color palette.
- **Body & Data:** *Inter* is the workhorse for long-form content and ticket details, chosen for its unparalleled legibility in both light and dark modes.

Hierarchy is intentionally oversized. On desktop, large headlines should dominate the layout to create a "poster" feel for events.

## Layout & Spacing
The layout philosophy is **Generous and Fluid**. It utilizes a 12-column grid for desktop with significant outer margins to center the content and evoke a premium feel.

- **Floating Architecture:** Elements should rarely touch the edges of the viewport. Instead, content lives in "contained" areas with ample padding.
- **Vertical Rhythm:** Use the `stack-lg` (64px) for section breathing room and `stack-md` (32px) for grouping related components.
- **Mobile Reflow:** On mobile, margins reduce to 20px, and the grid collapses to a single column, but internal card padding remains high to maintain the luxurious aesthetic.

## Elevation & Depth
Depth is created through **Tonal Stacking** and **Soft Diffusion**.

- **Surfaces:** Dark mode uses a three-tier system: Base (Rich Black), Surface (Charcoal), and Overlay (Slate).
- **Shadows:** Avoid harsh blacks. Use high-spread, low-opacity shadows tinted with the Primary Maroon color (#5C0A18 at 15% opacity) to make cards appear as if they are floating in an atmospheric space.
- **Glassmorphism:** Navigation bars and "Quick Buy" drawers use a 20px backdrop blur with a 10% white (light mode) or 5% white (dark mode) tint. A 1px translucent border (stroke) must be applied to all glass elements to define their edges.

## Shapes
The design system utilizes **Rounded (0.5rem base)** shapes to soften the technical nature of decentralized platforms. 

- **Primary Cards:** Always use `rounded-xl` (1.5rem / 24px) to create a friendly, modern container.
- **Interactive Elements:** Buttons and input fields use `rounded-lg` (1rem / 16px).
- **VIP Tags:** Utilize pill-shaped radii (3rem) for status badges and category chips to differentiate them from functional UI components.

## Components
### Buttons
- **Primary:** Gradient fill from Deep Maroon (#5C0A18) to Royal Burgundy (#7D1128). Use a subtle 1px inner glow on the top edge. Text is White, font is Sora Semi-Bold.
- **Secondary:** Transparent background with a 1px border of Wine Red.
- **Premium:** Gradient of Luxury Gold to Champagne Gold with dark text for high-tier actions.

### Cards
- **Event Cards:** Large 24px radius. High-resolution imagery with a subtle Wine Red gradient overlay at the bottom to ensure white typography remains legible.
- **Floating Effect:** Cards should have a 1px stroke (Slate at 20% opacity) and a deep soft shadow.

### Input Fields
- Backgrounds should be slightly darker than the surface color (Charcoal in dark mode) with a subtle bottom border that glows Maroon upon focus.

### Navigation
- A fixed top navigation bar with a heavy backdrop blur. Use Luxury Gold for the active state indicator—a simple 4px dot beneath the nav item.

### Chips & Badges
- Used for ticket status (e.g., "Early Bird," "VIP"). Use the Champagne Gold background with dark text for a "golden ticket" feel.