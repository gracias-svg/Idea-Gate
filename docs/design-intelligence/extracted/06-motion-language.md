# IDEAGATE

# Motion Language v1

Version: 1.0

Status: Implementation Specification

Derived From

- Design Intelligence Library
- DIL RAW
- Global Design Language
- Composition Language
- Navigation Language
- Typography Language
- Material Language

---

# Purpose

Motion exists to explain.

It should never exist solely for decoration.

Every animation should help users understand:

- what changed
- why it changed
- where it moved
- what they should notice next

If removing an animation makes the interface easier to understand, that animation should not exist.

---

# Motion Philosophy

IdeaGate should feel alive.

Not flashy.

Not cinematic.

Not game-like.

Not playful.

Motion should feel closer to:

- Linear
- Cursor
- Figma
- Raycast
- Apple Human Interface

than to

- gaming dashboards
- marketing websites
- portfolio animations

---

# Motion Principles

## Principle 1

Every animation must communicate meaning.

Examples

Good

Panel expands because additional information became available.

Bad

Panel bounces simply because the user clicked.

---

## Principle 2

Animations should never delay work.

Users should never wait for animations.

Animations support interaction.

They do not block interaction.

---

## Principle 3

Fast interactions feel intelligent.

Slow interactions feel heavy.

---

## Motion Categories

### Navigation Motion

Purpose

Maintain orientation.

Examples

Workspace switching

Sidebar expansion

Tab changes

Breadcrumb transitions

Navigation should feel continuous rather than abrupt.

---

### Workspace Motion

Purpose

Help users understand spatial relationships.

Examples

Panels opening

Panel resizing

Editor changes

Split views

Comparison mode

Workspace motion should preserve context.

---

### Feedback Motion

Purpose

Confirm user actions.

Examples

Save complete

Artifact updated

Stage completed

Upload finished

Feedback animations should be subtle.

Never celebratory.

---

### AI Motion

Purpose

Communicate thinking.

AI should never appear frozen.

Examples

Streaming responses

Reasoning generation

Artifact creation

Review completion

Confidence updates

The interface should indicate progress without pretending intelligence.

---

### Agent Motion

Purpose

Visualize orchestration.

Office should feel like coordinated work.

Agents should move with intent.

Movement should represent actual system state whenever possible.

Avoid random wandering.

---

### Graph Motion

Purpose

Preserve mental models.

Blueprint transitions should never rearrange nodes unexpectedly.

Movement should preserve user orientation.

---

# Timing Philosophy

Instant feedback

Less than 100 ms

Small UI transitions

100–180 ms

Panel transitions

180–250 ms

Workspace transitions

250–350 ms

Large structural changes

350–450 ms

Avoid animations longer than 500 ms unless they communicate meaningful progress.

---

# Easing Philosophy

Use easing that feels natural.

Avoid exaggerated bounce.

Avoid elastic motion.

Motion should accelerate gently and settle smoothly.

Animations should feel engineered rather than playful.

---

# Hover States

Hover should communicate possibility.

Not excitement.

Hover effects should include one or more of:

- subtle elevation
- gentle brightness change
- cursor feedback
- understated shadow

Avoid dramatic scaling.

Avoid glowing effects.

---

# Click States

Clicks should provide immediate confirmation.

Buttons should feel responsive.

The interface should acknowledge input within milliseconds.

---

# Loading States

Never leave users guessing.

Prefer

Skeletons

Streaming

Progress indicators

Incremental rendering

Avoid spinning loaders whenever meaningful progress can be shown.

---

# Skeleton Screens

Skeletons should resemble final layouts.

Avoid generic placeholder blocks.

Users should anticipate where information will appear.

---

# Progressive Rendering

Render information as soon as it becomes available.

Do not wait for every section to complete.

Users should experience continuous progress.

---

# AI Streaming

Generated content should stream naturally.

Avoid revealing entire responses instantly unless generation is genuinely complete.

Streaming should reinforce that work is occurring.

---

# Office Motion

Office is unique.

Agent movement should communicate:

Current task

Idle state

Collaboration

Review

Waiting

Completion

Agents should never move randomly.

Every movement should correspond to real execution whenever possible.

---

# Blueprint Motion

Graphs should animate intelligently.

Nodes should maintain relative positions.

Connections should morph smoothly.

Users should never lose spatial understanding.

---

# Mission Control Motion

Metrics should update without sudden jumps.

Charts should animate minimally.

Status changes should attract attention only when necessary.

---

# Notification Motion

Notifications should enter quietly.

Exit automatically.

Never interrupt workflow.

Avoid large popups.

Avoid blocking dialogs.

---

# Error Motion

Errors should attract attention through clarity.

Not dramatic shaking.

Prefer subtle emphasis.

---

# Motion Accessibility

Respect reduced motion preferences.

Users who disable motion should lose animation, not usability.

The interface must remain understandable without animations.

---

# Motion Quality Checklist

Before approving any animation ask

[ ] Does this animation explain something?

[ ] Does it preserve orientation?

[ ] Is it fast?

[ ] Is it consistent?

[ ] Does it reduce cognitive effort?

[ ] Does it feel premium?

[ ] Would removing it make the interface better?

If yes, remove it.

---

# Non-Negotiables

Never animate for decoration.

Never block users with animations.

Never use motion to compensate for poor layout.

Never make users wait for visual effects.

Motion should always improve understanding.

---

# Used By

Claude Chat

Claude Code

Animation Reviews

Perceptual Reviews

Future Motion System