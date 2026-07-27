# IDEAGATE — LOVABLE MASTER SPECIFICATION
### Version 1.0
### Status: Active Design Authority
### Document Type: Product & Design Specification
### Scope: Lovable UI Development
### Owner: IdeaGate Product Team
### Last Updated: July 2026

---

# DOCUMENT PURPOSE

This document is the permanent product specification used to guide the UI/UX design and implementation of IdeaGate inside Lovable.

It is **not** a prompt.

It is **not** a project log.

It is **not** implementation documentation.

Instead, it defines the product vision, architectural boundaries, design principles, quality expectations, and development rules that every future Lovable prompt must follow.

The goal is to ensure that every screen, interaction, animation, layout, component, and workflow contributes toward one coherent product vision.

This document is intended to remain stable over time and evolve only when the product direction materially changes.

---

# HOW TO USE THIS DOCUMENT

Every new Lovable session should follow this order:

1. Read this specification completely.
2. Treat this document as the primary source of product context.
3. Read the Design Intelligence Library PDFs (when attached) as visual reference material.
4. Read only the current implementation prompt.
5. Build only the requested phase.
6. Do not redesign unrelated parts of the product.
7. Preserve architectural boundaries defined in this document.

If there is ever a conflict between an implementation prompt and this specification, this specification takes precedence unless the prompt explicitly states that it is updating the specification.

---

# HOW AN AI SHOULD INTERPRET THIS DOCUMENT

This document defines:

• What IdeaGate is.

• What IdeaGate is not.

• Long-term product direction.

• UI philosophy.

• Interaction philosophy.

• Design quality standards.

• Integration boundaries.

• Future roadmap.

This document intentionally avoids low-level implementation details.

Those belong inside individual implementation prompts.

---

# PRODUCT OVERVIEW

## Product Name

IdeaGate

---

## Product Category

AI-Native Product Lifecycle Operating System

---

## One-Line Description

IdeaGate transforms a raw product idea into a complete set of structured Product Management artifacts through a lifecycle-driven, multi-agent workflow while providing a premium collaborative workspace for thinking, reviewing, improving, and executing product work.

---

## Product Identity

IdeaGate is **not** a note-taking application.

IdeaGate is **not** a markdown editor.

IdeaGate is **not** a documentation platform.

IdeaGate is **not** a generic AI chatbot.

IdeaGate is a Product Operating System.

The system exists to help product teams think better, validate faster, document consistently, and execute confidently.

The document is only one surface inside that operating system.

---

# PRODUCT MISSION

Enable individuals and product teams to move from an idea to a production-ready product artifact set through structured thinking, AI collaboration, lifecycle enforcement, and exceptional user experience.

---

# LONG-TERM PRODUCT VISION

IdeaGate should become the operating environment where Product Managers perform the majority of their work.

This includes:

• product discovery

• research

• user understanding

• value proposition

• prioritization

• architecture

• UX

• documentation

• backlog planning

• AI collaboration

• artifact review

• product execution

The experience should feel calm, focused, intelligent, and trustworthy.

---

# PRODUCT PHILOSOPHY

IdeaGate believes that great products emerge from disciplined thinking rather than isolated documents.

Every artifact is connected.

Every decision has context.

Every stage builds upon previous work.

The system exists to improve product thinking rather than simply generate content.

---

# CORE DESIGN PRINCIPLES

The following principles govern every future UI decision.

## Principle 1

The document is the hero.

The interface should never compete with the content.

---

## Principle 2

AI is a collaborator.

AI should guide thinking.

It should never dominate the experience.

---

## Principle 3

The interface should reduce cognitive load.

Users should spend more time thinking and less time operating software.

---

## Principle 4

Premium quality is a functional requirement.

Visual refinement is not decoration.

It communicates trust, confidence, and craftsmanship.

---

## Principle 5

Motion exists to explain state.

Motion should never exist purely for decoration.

---

## Principle 6

Consistency is more important than novelty.

Every interaction should reinforce familiarity.

---

## Principle 7

The system should feel alive without becoming visually noisy.

---

# DESIGN QUALITY TARGET

The target quality is equivalent to premium mid-2026 SaaS products.

Reference quality includes products such as:

• Linear

• Notion

• Cursor

• Vercel

• Raycast

• Craft

These references are used to understand interaction quality, typography, hierarchy, responsiveness, and refinement.

They must never be copied directly.

Instead, IdeaGate should develop its own coherent visual language inspired by proven interaction patterns.

---

# PRODUCT PERSONALITY

The product should feel:

• Intelligent

• Calm

• Precise

• Premium

• Modern

• Editorial

• Focused

• Trustworthy

• Confident

• Purposeful

The product should never feel:

• Busy

• Noisy

• Over-animated

• Playful without purpose

• Experimental at the expense of usability

• Visually inconsistent

---

# DESIGN GOALS

Every implementation should optimize for:

• readability

• clarity

• craftsmanship

• visual hierarchy

• elegant typography

• comfortable spacing

• premium interaction design

• accessibility

• responsiveness

• performance

• long-term maintainability

---

# ARCHITECTURAL BOUNDARIES

This Lovable project is responsible only for the presentation layer.

Lovable should not redesign backend architecture.

Lovable should not redesign the coordinator.

Lovable should not redesign the journey engine.

Lovable should not redesign lifecycle logic.

Lovable should not redesign persistence.

Lovable should not redesign filesystem architecture.

Lovable should focus on:

• UI

• UX

• interaction

• layout

• navigation

• motion

• information architecture

• component quality

• responsiveness

• accessibility

The backend remains the source of truth.

---

# CURRENT PRODUCT STATE

The backend architecture already exists.

The lifecycle engine already exists.

The coordinator-worker architecture already exists.

The multi-agent workflow already exists.

The artifact generation pipeline already exists.

The current effort focuses on elevating the user experience to a premium product standard without changing the architectural foundation.

---

# FUTURE PRODUCT DIRECTION

The UI should be designed with future capabilities in mind.

These include:

• orchestration

• live collaboration

• comments

• inline review

• AI suggestions

• workspace intelligence

• artifact relationships

• lifecycle visualization

• agent observability

• execution monitoring

• analytics

• version awareness

The UI should make room for these capabilities without requiring major redesign later.

---

# DEVELOPMENT APPROACH

Development will proceed in independent phases.

Each phase should improve one part of the experience without destabilizing completed work.

Future prompts will reference only the phase currently under development.

The implementation of one phase should not require redesigning previously approved work.

---

# END OF PART 1

Part 2 continues with:

• Screen inventory

• Visual language

• Interaction philosophy

• Component philosophy

• Motion language

• Prompting rules

• Development phases

• Integration strategy

• Definition of Done

---

# PART 2 — DESIGN SYSTEM, EXPERIENCE LANGUAGE & EXECUTION MODEL

This section defines how IdeaGate should look, behave, evolve, and be implemented.

Every future Lovable implementation prompt must align with these principles.

---

# VISUAL LANGUAGE

IdeaGate should feel like a premium software product designed for professional knowledge workers.

The visual language should prioritize clarity before decoration.

Every screen should communicate confidence through restraint rather than visual complexity.

The design language should consistently express:

• editorial typography

• premium spacing

• strong hierarchy

• calm information density

• precise alignment

• purposeful whitespace

• restrained colour

• subtle depth

• refined motion

• high readability

The experience should feel closer to professional operating systems than marketing websites.

---

# DESIGN INTELLIGENCE POLICY

The attached Design Intelligence Library PDFs are permanent visual research assets.

They are not implementation specifications.

They exist to explain:

• why a design works

• what user problem it solves

• where it maps inside IdeaGate

• which interaction principles should be adapted

Whenever a prompt references the Design Intelligence Library, Lovable should:

1. Study the referenced pattern.
2. Extract the interaction principles.
3. Adapt those principles into the existing IdeaGate visual language.
4. Maintain visual consistency across the product.

Do not assemble unrelated visual styles from multiple sources.

The result should feel like one coherent product.

---

# APPROVED REFERENCE CATEGORIES

The Design Intelligence Library currently includes reference material for:

• Executive Dashboards

• AI Workspaces

• Knowledge Editors

• Whiteboards

• Graph Views

• Data Tables

• Side Panels

• Navigation

• Motion

• Typography

• Cards

• Empty States

• Settings

• Command Palette

• Agent Interfaces

• Collaboration

• Node Graphs

• Visual Hierarchy

• Colour Systems

• Material Systems

Each future phase should explicitly state which categories it uses.

---

# REFERENCE USAGE STANDARD

When using the Design Intelligence Library:

DO:

• analyse composition

• analyse spacing

• analyse hierarchy

• analyse interaction quality

• analyse motion

• analyse navigation

• analyse readability

• analyse accessibility

• analyse information architecture

Do NOT:

• reproduce branding

• recreate layouts verbatim

• imitate visual identity

• copy proprietary illustrations

• duplicate another product's look

IdeaGate must remain visually original while benefiting from proven interaction patterns.

---

# EXPERIENCE PRINCIPLES

The product should consistently create the following experience:

Reading should feel uninterrupted.

Writing should feel confident.

AI should feel invited rather than intrusive.

Information should feel organised.

Progress should always be visible.

Navigation should always feel predictable.

Animations should communicate state.

Users should always know where they are.

Complexity should be progressively disclosed.

The interface should disappear behind the work.

---

# INTERACTION PHILOSOPHY

Interactions should favour confidence over novelty.

Hover states should be subtle.

Selections should be obvious.

Contextual actions should appear only when relevant.

Command palettes should accelerate expert workflows.

Keyboard users should receive first-class support.

Touch targets should remain generous.

Every interaction should reduce effort rather than increase it.

---

# COMPONENT PHILOSOPHY

Every component must justify its existence.

Components should solve a user problem.

Examples include:

Navigation

Panels

Cards

Tables

Editors

Dashboards

Command Palettes

Sidebars

Drawers

Dialogs

Comments

Timelines

Agent Cards

Activity Feeds

Status Indicators

Every component should behave consistently regardless of screen.

---

# MOTION LANGUAGE

Motion exists to explain state changes.

Motion should never distract from content.

Guiding principles:

• Immediate feedback

• Smooth transitions

• Soft easing

• Minimal layout shift

• Purposeful animation

Avoid:

• excessive parallax

• decorative motion

• unnecessary bounce

• distracting effects

---

# SCREEN INVENTORY

The current product roadmap includes:

Phase 1

Landing Experience

Phase 2

Application Shell

Phase 3

Mission Control

Primary operational dashboard showing:

• live agent activity

• lifecycle progress

• execution status

• observability

• system health

• analytics

Phase 4

Studio

The primary document workspace.

AI-native.

Focused.

Collaborative.

Phase 5

Blueprint

Lifecycle visualisation.

Dependencies.

Journey.

Architecture.

Phase 6

Desk

Artifact browsing and management.

Phase 7

Analytics

Executive insights.

Performance.

Quality.

Lifecycle intelligence.

Phase 8

AI Collaboration

Inline review.

Suggestions.

Contextual improvements.

Phase 9

Future Collaboration

Comments.

Presence.

Review workflows.

Shared editing.

---

# FUTURE-READY DESIGN

Every screen should leave room for:

• orchestration

• live collaboration

• workflow automation

• notifications

• review states

• version history

• artifact relationships

• AI reasoning

without requiring major redesign.

---

# DEFINITION OF DONE

A phase is complete only when it satisfies all of the following:

✓ Visually consistent with the IdeaGate design language.

✓ Responsive.

✓ Accessible.

✓ Cohesive with previous phases.

✓ Ready to integrate into the existing Next.js application.

✓ Does not require backend changes.

✓ Leaves room for future capabilities.

---

# PROMPTING RULES FOR LOVABLE

Every implementation prompt should:

1. Assume this specification has already been read.
2. Modify only the requested phase.
3. Preserve approved work.
4. Respect architectural boundaries.
5. Use the attached Design Intelligence Library as research.
6. Explain design decisions where appropriate.
7. Produce production-quality React/Next.js-compatible UI that can later be integrated into the existing application.
8. Prefer reusable components over one-off implementations.
9. Optimize for premium mid-2026 SaaS quality.

---

# IMPLEMENTATION PRINCIPLE

Lovable is responsible for exploring and refining the presentation layer.

The existing backend remains the source of truth.

No backend architecture should be redesigned during UI exploration.

Approved UI will later be integrated into the production Next.js application and connected to the existing APIs, coordinator, lifecycle engine, and workspace.

---

# END OF MASTER SPECIFICATION v1.0