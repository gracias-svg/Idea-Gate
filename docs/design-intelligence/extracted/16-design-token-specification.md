# IDEAGATE

# Design Token Specification v1

Version: 1.0

Status: Implementation Contract

Derived From

- Design Intelligence Library
- DIL RAW
- Global Design Language
- Material Language
- Typography Language
- Premium SaaS Patterns
- Animation Playbook

---

# Purpose

Design tokens create consistency.

Every screen should feel like part of the same Product Operating System because it uses the same visual vocabulary.

Tokens represent meaning rather than appearance.

Avoid hard-coded values whenever possible.

---

# Token Philosophy

Tokens should be

Reusable

Semantic

Composable

Predictable

Scalable

Implementation-independent

---

# Spacing Scale

Use an 8-point grid with limited half-steps.

| Token | Value | Typical Usage |
|--------|------:|---------------|
| space-0 | 0 px | None |
| space-1 | 4 px | Tight icon spacing |
| space-2 | 8 px | Inline spacing |
| space-3 | 12 px | Dense layouts |
| space-4 | 16 px | Default padding |
| space-5 | 24 px | Section spacing |
| space-6 | 32 px | Card separation |
| space-7 | 48 px | Workspace grouping |
| space-8 | 64 px | Large layout spacing |
| space-9 | 96 px | Major section separation |

---

# Typography Scale

| Token | Purpose |
|--------|---------|
| text-xs | Metadata |
| text-sm | Supporting text |
| text-md | Default body |
| text-lg | Emphasized body |
| text-xl | Section heading |
| text-2xl | Workspace heading |
| text-3xl | Screen title |
| text-4xl | Hero title (rare) |

Typography should communicate hierarchy before color.

---

# Font Weights

| Token | Usage |
|--------|-------|
| weight-regular | Body |
| weight-medium | Labels |
| weight-semibold | Section headings |
| weight-bold | Screen titles |

Avoid excessive bold text.

---

# Border Radius

| Token | Usage |
|--------|-------|
| radius-none | Tables |
| radius-sm | Inputs |
| radius-md | Buttons |
| radius-lg | Cards |
| radius-xl | Panels |
| radius-full | Circular elements |

Maintain consistency across workspaces.

---

# Elevation

Use elevation to communicate hierarchy rather than decoration.

| Token | Usage |
|--------|-------|
| elevation-0 | Canvas |
| elevation-1 | Cards |
| elevation-2 | Floating panels |
| elevation-3 | Dialogs |
| elevation-4 | Critical overlays |

Prefer subtle shadows.

Avoid dramatic depth effects.

---

# Semantic Colors

Use semantic tokens rather than fixed palette names.

Core tokens include

surface

surface-muted

surface-elevated

border

border-active

text-primary

text-secondary

text-muted

accent

success

warning

danger

focus

selection

disabled

Semantic meaning should remain stable even if the visual palette changes.

---

# Icon Sizes

| Token | Usage |
|--------|-------|
| icon-xs | Inline |
| icon-sm | Lists |
| icon-md | Buttons |
| icon-lg | Navigation |
| icon-xl | Hero or illustration |

Use a single icon family throughout the application.

---

# Component Heights

| Token | Usage |
|--------|-------|
| control-sm | Dense controls |
| control-md | Default controls |
| control-lg | Prominent actions |

Avoid mixing heights within the same toolbar.

---

# Layout Widths

Standardize maximum content widths.

| Token | Usage |
|--------|-------|
| layout-narrow | Reading |
| layout-default | Documents |
| layout-wide | Dashboards |
| layout-full | Graphs and Office |

Reading views should not stretch indefinitely.

---

# Grid System

Desktop

12-column grid

Tablet

8-column grid

Mobile

4-column grid

Columns should collapse predictably.

---

# Breakpoints

| Token | Purpose |
|--------|---------|
| bp-sm | Mobile |
| bp-md | Tablet |
| bp-lg | Laptop |
| bp-xl | Desktop |
| bp-2xl | Large monitors |

Behavior changes should occur at these breakpoints rather than arbitrary widths.

---

# Z-Index Layers

| Token | Usage |
|--------|-------|
| layer-base | Content |
| layer-navigation | Navigation |
| layer-floating | Inspectors |
| layer-dialog | Dialogs |
| layer-toast | Notifications |
| layer-overlay | Blocking overlays |

Avoid arbitrary z-index values.

---

# Motion Tokens

Standardize durations.

| Token | Usage |
|--------|-------|
| motion-fast | Hover |
| motion-normal | Panels |
| motion-slow | Page transitions |

Refer to the Animation Playbook for choreography.

---

# Interaction States

Every interactive component supports

Default

Hover

Focus

Pressed

Selected

Disabled

Loading

Error

Success

States should remain visually consistent across components.

---

# Focus Treatment

Keyboard focus must be clearly visible.

Never rely solely on browser defaults.

Focus indicators should use the semantic focus token.

---

# Responsive Principles

Layouts should adapt by

Reflowing

Collapsing

Reordering

Never by removing essential functionality.

---

# Accessibility

Maintain sufficient contrast.

Support keyboard navigation.

Respect reduced motion preferences.

Provide descriptive labels for icons and controls.

---

# Token Governance

New tokens should only be introduced when an existing token cannot express the required meaning.

Avoid creating near-duplicate tokens.

Review token additions during design review.

---

# Quality Checklist

Before approving new UI ask

[ ] Are only approved tokens used?

[ ] Is spacing consistent?

[ ] Does typography follow the hierarchy?

[ ] Are semantic colors used instead of hard-coded values?

[ ] Are component sizes consistent?

[ ] Does the layout respect the grid?

[ ] Are accessibility requirements satisfied?

---

# Non-Negotiables

Never hard-code visual values without justification.

Never create duplicate tokens.

Never bypass semantic tokens with arbitrary colors.

Design tokens are the shared language between design and implementation.

---

# Used By

Claude Chat

Claude Code

Frontend Engineering

Design Reviews

Future Design System