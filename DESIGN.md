---
colors:
  canvas: "#0b0b0d"
  surface: "#151519"
  surface-raised: "#1d1d22"
  text: "#f1efe9"
  text-muted: "#a4a1a8"
  accent: "#ef7f45"
  border: "#2b2b31"
typography:
  display: "var(--font-display)"
  body: "var(--font-body)"
  hero: "600 clamp(2.5rem, 7vw, 6.75rem)/0.92 var(--font-display)"
  heading: "600 clamp(1.75rem, 4vw, 3.5rem)/1 var(--font-display)"
  body-copy: "400 clamp(1rem, 1.4vw, 1.125rem)/1.6 var(--font-body)"
  label: "600 0.75rem/1.2 var(--font-body)"
rounded:
  card: "1.75rem"
  control: "999px"
  small: "0.75rem"
spacing:
  page-inline: "clamp(1rem, 5vw, 5rem)"
  section-block: "clamp(4rem, 9vw, 8rem)"
  card-gap: "clamp(0.875rem, 2vw, 1.5rem)"
components:
  portfolio-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "0"
  carousel-control:
    backgroundColor: "{colors.text}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    size: "3rem"
motion:
  duration-fast: "180ms"
  duration-card: "520ms"
  ease-gallery: "cubic-bezier(0.16, 1, 0.3, 1)"
shadows:
  card: "0 24px 70px -32px rgb(0 0 0 / 0.72)"
aspectRatios:
  portfolio-card: "4 / 5"
containers:
  content: "90rem"
breakpoints:
  tablet: "48rem"
  desktop: "64rem"
borderWidths:
  hairline: "1px"
opacity:
  overlay-start: "0.08"
  overlay-end: "0.88"
---

# 1. Overview

Reading this as: a personal project gallery for prospective clients, with a cinematic exhibition language in the Bento/Card line.

The concept spine is **an evening gallery of finished digital work**. The page stays quiet so each project can carry its own color and subject. Layout behaves like a gallery rail, typography behaves like restrained exhibition signage, and motion feels weighted rather than playful.

The signature moment is the horizontal project rail: the active card expands visually through scale and contrast while the next card remains visible as an invitation. A quieter detail is the changing accent line derived from each project's identity.

Photography and generated covers must preserve each project's real visual character. Copy is short, factual and in Portuguese. Density is low, variance is concentrated inside the project covers, and motion is moderate.

# 2. Colors

The gallery uses `{colors.canvas}` instead of pure black and `{colors.text}` instead of pure white. Surfaces stay neutral. `{colors.accent}` connects the xDouglas music identity to controls without recoloring client projects.

Project covers keep their native palettes: ivory and gold for Agenda Ella, charcoal and amber for WL Tour, graphite and orange for Martins Tour, near-black and warm orange for xDouglas Música. A dark image gradient guarantees readable overlay text.

# 3. Typography

Display type is compact, modern and slightly editorial; body type prioritizes legibility. The hero uses `{typography.hero}` and must remain within two lines on desktop and three on narrow mobile. Project titles use `{typography.heading}` only inside the cards. Labels use `{typography.label}` with modest tracking.

No gradient text, all-uppercase paragraph copy or decorative italics. Text overlay is HTML, never baked into cover images.

# 4. Layout

The page has a compact header, one introductory block and one dominant carousel. Content is capped at `{containers.content}` with inline padding from `{spacing.page-inline}`.

Desktop shows cards near 4:5 with roughly two full cards and a visible slice of the next. Tablet shows about one and a half cards. Mobile shows one dominant card plus a narrow preview of the next. Horizontal motion supports touch drag, trackpad, buttons and keyboard without hijacking vertical scroll.

The page uses natural document height and `min-height: 100dvh`, never fixed `100vh`. No empty grid cells or decorative sections are added.

# 5. Elevation & Depth

Depth comes from photographic contrast, the card shadow `{shadows.card}` and a hairline border. The background remains flat. No glow, glass card or scrolling backdrop blur.

Inactive cards reduce contrast slightly; active and hovered cards return to full contrast and translate by a few pixels using transforms only.

# 6. Shapes

Project cards use `{rounded.card}` consistently. Circular controls use `{rounded.control}`. Nested image and overlay share the same clipping radius. Controls meet a 44px minimum touch target.

# 7. Components

The header contains the xDouglas name and a short role line. The introduction states that the page gathers sites and digital projects created by Douglas.

`PortfolioCarousel` reads a small static project list. Only entries marked public render on the home page. Each `PortfolioCard` contains a generated cover, category, project name, short description and external-link affordance. External projects open their final domains in a new tab with safe rel attributes; xDouglas Música opens `/musica` in the same tab.

Previous and next controls disable at the ends. Keyboard left/right moves one card. Pointer dragging uses native scroll snap. Reduced motion removes translation and uses opacity only.

The manual project record contains: slug, name, category, description, image, href, visibility and external flag. Adding or hiding a project requires changing only that list and adding an image file.

# 8. Do's and Don'ts

- Keep the portfolio home independent from music authentication and database availability.
- Keep generated images optimized and dimensioned; total initial cover weight should stay below 3 MB.
- Preserve semantic landmarks, one H1, skip link, visible focus rings and AA contrast.
- Preserve the current music product under `/musica` without duplicating its implementation.
- Do not add an admin panel, CMS, automatic screenshots, subdomains or publishing automation.
- Do not show hidden pilots on the home page; direct routes remain accessible without passwords.
- Do not use autoplay, infinite loops, pagination dots or scroll hijacking.
- Do not copy 21st.dev source code verbatim; reproduce the approved interaction and composition within this project.
