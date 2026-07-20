# IDEAGATE

# UI Component Inventory

Version: 1.0

Status: Implementation Specification

Audience

Frontend Engineers

Claude Code

Design System Contributors

---

# Purpose

This document defines the canonical component inventory for IdeaGate.

Every screen should be composed from these shared primitives.

The goal is to create a coherent Product Operating System where every interaction feels consistent regardless of workspace.

This document complements—not replaces—the Design Intelligence Specification.

---

# Component Philosophy

Components should be:

Reusable

Composable

Accessible

Responsive

Theme-aware

Predictable

Every component should have a single responsibility.

Avoid screen-specific implementations unless absolutely necessary.

---

# Component Hierarchy

Level 1 — Foundation

Typography

Icon

Divider

Avatar

Badge

Tooltip

Spinner

Skeleton

Separator

Surface

Layer

Focus Ring

---

Level 2 — Controls

Button

Icon Button

Toggle

Checkbox

Radio

Switch

Input

Textarea

Select

Search Field

Command Palette

Slider

Segmented Control

Date Picker

Filter Chip

---

Level 3 — Navigation

Sidebar

Workspace Navigation

Top Navigation

Tabs

Breadcrumb

Context Switcher

Page Header

Workspace Header

Section Header

Pagination

---

Level 4 — Layout

Panel

Card

Stack

Grid

Split View

Resizable Panel

Inspector Panel

Drawer

Modal

Popover

Accordion

Scroll Container

Empty State

---

Level 5 — Data Display

Property List

Key Value Pair

Status Badge

Metric Card

Progress Bar

Timeline

Activity Feed

Notification

Alert

Toast

Log Viewer

Version Badge

Tag

Statistic Block

---

Level 6 — AI Components

AI Suggestion Card

Confidence Indicator

Reasoning Panel

Comparison Panel

Review Drawer

Conversation Summary

Recommendation Block

Evidence Panel

Decision Card

AI Action Bar

---

Level 7 — Product Components

Artifact Card

Artifact Viewer

Artifact Navigator

Lifecycle Progress

Dependency Graph

Graph Node

Graph Edge

Stage Card

Decision Timeline

Execution Queue

Agent Card

Agent Status

Workspace Summary

Mission Metric

Health Indicator

Risk Indicator

Review Queue

Validation Card

---

# Standard Component Contract

Every component should define:

Purpose

Responsibilities

Props

Variants

States

Accessibility

Motion

Design Tokens

Composition Rules

Future Extension Points

---

# Example Component Contract

## Panel

Purpose

Container for grouping related information.

Responsibilities

Organize content.

Provide visual hierarchy.

Support nested layouts.

Variants

Default

Elevated

Muted

Highlighted

Critical

States

Default

Hover

Focused

Disabled

Loading

Collapsed

Accessibility

Keyboard accessible.

Semantic regions where appropriate.

Motion

Subtle elevation transitions.

Token Usage

Surface

Border

Radius

Shadow

Spacing

Composition

Can contain Cards, Property Lists, Timelines, Metrics, AI Panels.

Avoid deeply nesting Panels.

---

## Button

Purpose

Primary interaction control.

Variants

Primary

Secondary

Ghost

Danger

Success

Icon

Loading

States

Default

Hover

Pressed

Focused

Disabled

Loading

Accessibility

Visible focus ring.

Keyboard activation.

Minimum hit area.

Motion

Fast feedback.

Subtle elevation.

Composition

Avoid more than one Primary Button per logical section.

---

## Artifact Viewer

Purpose

Display generated product artifacts.

Responsibilities

Readable typography.

Version awareness.

AI annotations.

Comparison support.

Inline comments.

Future

Collaborative editing.

---

## Inspector Panel

Purpose

Provide contextual information without changing the primary workspace.

Responsibilities

Metadata.

AI reasoning.

Properties.

Dependencies.

Recommendations.

Variants

Collapsed

Expanded

Pinned

Floating

Composition

Always secondary to the primary workspace.

---

## Timeline

Purpose

Display chronological activity.

Supports

Agent activity.

Lifecycle progression.

Version history.

Review history.

Execution logs.

---

## Agent Card

Purpose

Represent an AI specialist.

Displays

Current task.

Status.

Queue.

Progress.

Dependencies.

Last action.

Future

Live collaboration.

Resource usage.

---

## Graph Node

Purpose

Represent an artifact or lifecycle stage.

Supports

Hover.

Selection.

Expansion.

Dependency highlighting.

Health indicators.

Version information.

---

## Metric Card

Purpose

Display a single KPI.

Should include

Title.

Value.

Trend.

Context.

Optional recommendation.

Avoid multiple unrelated metrics.

---

## AI Suggestion Card

Purpose

Present actionable AI recommendations.

Must include

Recommendation.

Reasoning.

Confidence.

Evidence.

Expected impact.

Alternative actions.

Never present recommendations without context.

---

# Accessibility Standards

Every component must support:

Keyboard navigation

Visible focus

Semantic HTML

Screen readers

Reduced motion

Contrast compliance

Responsive layouts

Accessibility is a release requirement.

---

# Motion Standards

Every component should follow the Animation Playbook.

Motion should:

Explain

Guide

Preserve orientation

Communicate hierarchy

Avoid decorative animation.

---

# Design Token Compliance

Every component must consume shared tokens for:

Spacing

Typography

Radius

Elevation

Borders

Semantic colors

Animation

Sizing

Never hard-code design values.

---

# Component Reuse Policy

Before creating a new component, ask:

Can an existing component be extended?

Can this be composed from existing primitives?

Can this behavior become a variant?

Prefer extension over duplication.

---

# Screen Composition Rules

Every workspace should primarily use the shared inventory.

Desk

Artifact Viewer

Inspector Panel

Timeline

AI Suggestion Card

Property List

Studio

Artifact Viewer

Comparison Panel

AI Action Bar

Version Badge

Review Drawer

Office

Agent Card

Execution Queue

Timeline

Workspace Summary

Status Badge

Blueprint

Graph Node

Graph Edge

Inspector

Property List

Dependency Graph

Mission Control

Metric Card

Health Indicator

Risk Indicator

Timeline

Recommendation Block

Alert

Improve

Comparison Panel

Artifact Viewer

Review Drawer

Decision Card

AI Suggestion Card

---

# Future Component Roadmap

Potential additions:

Collaboration Presence

Comment Threads

Approval Workflow

Portfolio Explorer

Knowledge Explorer

Simulation Controls

Governance Panel

Experiment Dashboard

Model Comparison

Token Cost Viewer

Memory Timeline

---

# Quality Checklist

Every component should:

[ ] Have a single responsibility

[ ] Be reusable

[ ] Be composable

[ ] Use shared design tokens

[ ] Follow accessibility standards

[ ] Support responsive layouts

[ ] Match motion guidelines

[ ] Preserve workspace consistency

[ ] Be documented before implementation

---

# Non-Negotiables

Do not create duplicate components.

Do not hard-code styling values.

Do not implement screen-specific UI without evaluating reuse.

Do not bypass shared design tokens.

Do not sacrifice accessibility for aesthetics.

Every new UI element should strengthen the consistency of IdeaGate as a premium AI-native Product Operating System.

---

# Reference Documents

This inventory should be used alongside:

01-global-design-language.md

02-composition-language.md

03-navigation-language.md

04-typography-language.md

05-material-language.md

06-motion-language.md

07-information-hierarchy.md

08-ai-interaction-language.md

09-visualization-language.md

10-dashboard-language.md

11-office-orchestration-language.md

12-blueprint-language.md

13-screen-blueprints.md

14-premium-saas-patterns.md

15-animation-playbook.md

16-design-token-specification.md

17-claude-chat-design-context.md

18-claude-code-design-context.md

Together, these documents define the authoritative Design Intelligence Specification for IdeaGate.