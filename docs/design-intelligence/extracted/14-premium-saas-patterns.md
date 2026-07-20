# IDEAGATE

# Premium SaaS Patterns v1

Version: 1.0

Status: Implementation Reference

Derived From

- Design Intelligence Library
- DIL RAW
- All previous Design Intelligence Specifications

---

# Purpose

This document captures reusable interaction and layout patterns repeatedly observed across premium SaaS products.

The objective is not to imitate any single product.

The objective is to identify patterns that consistently improve clarity, usability and perceived quality.

Every new IdeaGate feature should evaluate whether one of these patterns already solves the problem.

---

# Pattern 01

## Workspace First

The workspace is always the dominant visual element.

Navigation supports the workspace.

Panels support the workspace.

Nothing competes with the workspace.

Good examples

Cursor

Linear

Figma

---

# Pattern 02

## Persistent Context

Users should never lose context.

Always display

Project

Current workspace

Current artifact

Current lifecycle stage

Selection

Avoid forcing users to remember state.

---

# Pattern 03

## Progressive Panels

Instead of opening new pages,

expand context.

Examples

Inspector

History

Properties

AI Review

Dependencies

References

Users remain inside the same mental model.

---

# Pattern 04

## Split View

Two-column layouts should be preferred for comparison.

Examples

Current

↓

Improved

Original

↓

Review

Research

↓

Architecture

Never hide information users are comparing.

---

# Pattern 05

## Command Palette

Every meaningful action should eventually be executable through the Command Palette.

Examples

Open Project

Switch Workspace

Generate Artifact

Search

Review

Navigate

Command palettes become faster than menus.

---

# Pattern 06

## Contextual AI

AI appears where work occurs.

Never create a permanent chatbot that competes with the workspace.

Good

Inline suggestions

Review panel

Comparison panel

Reasoning drawer

Bad

Floating assistant window

---

# Pattern 07

## Explain Before Execute

Every important AI action explains

Purpose

Impact

Confidence

Dependencies

before execution.

Transparency creates trust.

---

# Pattern 08

## Inspector Pattern

Selecting an object opens an inspector.

The inspector never replaces the workspace.

Examples

Blueprint node

Artifact

Agent

Lifecycle stage

Review

---

# Pattern 09

## Detail on Demand

Default view

Simple

↓

Expanded

Detailed

↓

Expert

Technical

Avoid overwhelming first-time users.

---

# Pattern 10

## One Dominant Action

Every screen has exactly one primary action.

Examples

Improve

Generate

Review

Approve

Run

Avoid multiple competing primary buttons.

---

# Pattern 11

## Quiet Interface

Reduce unnecessary visual elements.

Prefer

Whitespace

Typography

Alignment

Instead of

Borders

Gradients

Decorations

---

# Pattern 12

## Structured Empty States

Every empty state explains

Why

Next step

Expected outcome

Avoid decorative illustrations without guidance.

---

# Pattern 13

## Layered Complexity

Users unlock complexity gradually.

Beginner

↓

Intermediate

↓

Advanced

↓

Developer

Avoid exposing every capability immediately.

---

# Pattern 14

## Live Status

Long-running work should expose

Current activity

Estimated progress

Recent completion

Upcoming work

Avoid static loading screens.

---

# Pattern 15

## Review Before Commit

AI-generated changes should support

Preview

Accept

Reject

Modify

Never overwrite work automatically.

---

# Pattern 16

## Universal Search

Search should span

Projects

Artifacts

Agents

Lifecycle

History

Commands

References

Users search once.

Not per module.

---

# Pattern 17

## Cross-Linking

Every artifact should expose

Dependencies

Related work

Referenced research

Downstream impact

Avoid isolated documents.

---

# Pattern 18

## Focus Mode

Every major workspace should support distraction-free mode.

Hide

Navigation

Panels

Utilities

Reveal only the primary workspace.

---

# Pattern 19

## Operational Honesty

Never fake activity.

Never simulate progress.

Never animate meaningless work.

Always represent real execution state whenever possible.

---

# Pattern 20

## Human Oversight

AI recommends.

Humans approve.

This principle applies everywhere.

---

# Pattern Evaluation Checklist

Before implementing any feature ask

[ ] Is there an existing premium SaaS pattern that solves this problem?

[ ] Does this pattern reduce cognitive load?

[ ] Does it preserve context?

[ ] Does it improve discoverability?

[ ] Does it make the workspace calmer?

[ ] Is it consistent with the rest of IdeaGate?

---

# Non-Negotiables

Never copy another product.

Extract principles.

Adapt thoughtfully.

Maintain one coherent Product Operating System.

---

# Used By

Claude Chat

Claude Code

Future Design Reviews

Design System Evolution

Every New Feature