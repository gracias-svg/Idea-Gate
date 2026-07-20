# IDEAGATE

# Animation Playbook v1

Version: 1.0

Status: Implementation Specification

Derived From

- Design Intelligence Library
- DIL RAW
- Motion Language
- Office Orchestration Language
- Blueprint Language
- Premium SaaS Patterns

---

# Purpose

Animation should explain.

It should never distract.

Every animation must answer at least one of these questions:

- What changed?
- Where did it go?
- What should the user notice?
- What is currently happening?

If it answers none of them, remove it.

---

# Motion Principles

Animation should feel

- Fast
- Calm
- Purposeful
- Predictable
- Continuous

Avoid

- Bouncy effects
- Elastic movement
- Decorative spins
- Excessive fades
- Random delays

---

# Standard Durations

Immediate Feedback

80–120 ms

Hover States

120–150 ms

Button Press

100–150 ms

Panel Open / Close

180–240 ms

Drawer

220–280 ms

Modal

220–300 ms

Page Transition

250–350 ms

Graph Layout Transition

300–500 ms

Office Agent Movement

300–450 ms

Timeline Updates

200–300 ms

Skeleton Fade Out

180–220 ms

AI Streaming Cursor

Continuous

---

# Preferred Easing

Use ease-out for

- Opening
- Revealing
- Hover
- Expansion

Use ease-in for

- Dismissal
- Exit
- Removal

Use ease-in-out for

- Position changes
- Graph layouts
- Workspace transitions

Avoid spring effects unless interaction benefits from physicality.

---

# Page Transition Rules

Preserve orientation.

The outgoing page should never disappear instantly.

The incoming page should establish itself before interaction begins.

Maintain scroll position where appropriate.

---

# Workspace Switching

When switching between

Desk

Studio

Office

Blueprint

Mission Control

Use

- Header persistence
- Navigation persistence
- Smooth content replacement

Avoid full application flashes.

---

# Panel Behavior

Side panels should

Slide

Fade

Preserve workspace position

Never cover critical controls unexpectedly.

---

# Inspector Animation

Selecting an object

↓

Inspector expands

↓

Content populates

↓

Interactive controls activate

Avoid instant content jumps.

---

# Card Animation

Cards should animate

Only when

Inserted

Removed

Reordered

Expanded

Collapsed

Never animate static cards.

---

# List Staggering

For lists

Maximum stagger

30 ms

Maximum total delay

300 ms

Large datasets should avoid stagger entirely.

---

# Button Feedback

Buttons should provide

Immediate visual confirmation

Focus state

Loading state

Completion state

Never rely solely on color.

---

# Loading States

Prefer

Skeletons

Progressive rendering

Incremental updates

Avoid indefinite spinners where possible.

---

# AI Streaming

Generated content should

Appear progressively

Maintain layout stability

Avoid jumping paragraphs

Scrolling should remain under user control.

---

# Office Choreography

Agent movement should indicate

Task assignment

Review hand-off

Completion

Dependency resolution

Blocked work

Agents should never wander without purpose.

---

# Blueprint Choreography

Graph updates should

Preserve node positions where possible

Animate edge creation

Highlight new relationships

Avoid complete graph re-layout unless necessary.

---

# Dashboard Updates

Metric changes should

Animate values subtly

Highlight meaningful changes

Avoid flashing widgets

Maintain readability.

---

# Notification Behavior

Notifications should

Slide in

Remain visible briefly

Dismiss smoothly

Support manual dismissal

Critical notifications remain until acknowledged.

---

# Drag and Drop

During drag

Increase elevation

Reduce surrounding emphasis

Highlight valid targets

Animate placement naturally.

---

# Expand / Collapse

Expansion should reveal

Structure first

Content second

Interactive controls last

Collapse should reverse this order.

---

# Empty State Transition

When data becomes available

Replace placeholder

↓

Fade content

↓

Enable interaction

Avoid abrupt layout changes.

---

# Error Transition

If an operation fails

Pause active animation

Display error state

Offer recovery

Never loop failure animations.

---

# Accessibility

Respect reduced motion preferences.

Provide non-motion alternatives for

Critical state changes

Notifications

Loading

Navigation

---

# Performance Budget

Animations must not noticeably delay interaction.

Prefer GPU-accelerated transforms.

Avoid animating

Width

Height

Top

Left

when transform-based alternatives exist.

---

# Animation Quality Checklist

Before approving an animation ask

[ ] Does it explain a change?

[ ] Does it preserve orientation?

[ ] Is the duration appropriate?

[ ] Does it respect accessibility settings?

[ ] Does it maintain responsiveness?

[ ] Would removing it reduce understanding?

If the answer to the last question is "No", remove the animation.

---

# Non-Negotiables

Never animate for decoration.

Never delay user actions.

Never fake activity.

Never compromise performance.

Animation exists to improve comprehension.

---

# Used By

Claude Chat

Claude Code

Frontend Engineering

Design Reviews

Interaction QA