# IDEAGATE

# Navigation Language v1

**Version:** 1.0

**Status:** Foundation

**Derived From**

- Design Intelligence Library
- DIL RAW
- Global Design Language v1
- Composition Language v1

---

# Purpose

Navigation is the operating system of IdeaGate.

It should never feel like moving between unrelated pages.

Users should always feel that they remain inside one intelligent workspace.

The objective of navigation is orientation, not exploration.

---

# Navigation Philosophy

Navigation should answer four questions immediately:

1. Where am I?
2. What can I do here?
3. Where can I go next?
4. How do I return?

If these answers are unclear, the navigation has failed.

---

# Primary Navigation

Primary Navigation represents permanent destinations.

These should rarely change.

Current examples include:

- Desk
- Studio
- Office
- Blueprint
- Mission Control
- Settings

Primary navigation must remain visually stable across the product.

---

# Secondary Navigation

Secondary Navigation changes depending on context.

Examples

Studio

- Improve
- Compare
- History
- References

Office

- Departments
- Teams
- Activity
- Logs

Blueprint

- Lifecycle
- Architecture
- Dependencies
- Journey

Secondary navigation should never replace primary navigation.

---

# Workspace Navigation

Users should feel they are changing perspective, not changing applications.

Example

Desk

↓

Studio

↓

Office

↓

Blueprint

Each workspace represents a different way of viewing the same project.

Never make users feel they have "left" the product.

---

# Navigation Hierarchy

Level 1

Global Navigation

Level 2

Workspace Navigation

Level 3

Context Tabs

Level 4

Inline Controls

Every navigation level should become progressively lighter.

---

# Sidebar Philosophy

The sidebar exists for orientation.

It should never dominate attention.

The workspace should always receive more visual emphasis.

The sidebar should contain:

- Navigation
- Current location
- Project switching
- Global search
- User profile

Avoid placing workflow content inside the sidebar.

---

# Header Philosophy

Headers should communicate context.

Headers are not toolbars.

Every header should answer:

- Which project?
- Which workspace?
- Which artifact?
- Current status

Avoid overcrowding headers with actions.

---

# Tabs

Tabs should represent views of the same information.

Tabs should not represent unrelated workflows.

Good

Research

↓

Architecture

↓

UX

↓

Backlog

Bad

Research

↓

Settings

↓

Notifications

↓

Billing

---

# Breadcrumbs

Use breadcrumbs only when hierarchy becomes deeper than two levels.

Example

Workspace

>

Artifact

>

Version

Avoid unnecessary breadcrumb trails.

---

# Command Palette

The Command Palette is the fastest way to operate IdeaGate.

It should support:

- Navigation
- Search
- Commands
- AI Actions
- Artifact switching
- Stage switching
- Project switching

Keyboard Shortcut

⌘K

The Command Palette should become the preferred navigation mechanism for experienced users.

---

# Search

Search should be global.

Users should not have to decide which screen to search.

Search should return:

Projects

Artifacts

Lifecycle stages

Agents

Files

Comments

History

References

Commands

---

# Context Awareness

Navigation should always communicate current context.

Examples

Current Project

Current Stage

Current Artifact

Current Agent

Current Workspace

Current Selection

Users should never lose orientation.

---

# Keyboard Navigation

Every major workflow should be executable without touching the mouse.

Essential shortcuts:

⌘K

Command Palette

⌘/

Search

⌘1

Desk

⌘2

Studio

⌘3

Office

⌘4

Blueprint

⌘5

Mission Control

Esc

Close Panels

Enter

Primary Action

---

# Notifications

Notifications should never interrupt work.

Prefer:

Indicators

Badges

Activity Timeline

Notification Center

Avoid disruptive popups.

---

# Multi-View Navigation

The same artifact should be viewable from multiple perspectives.

Example

Requirement

↓

Desk

Read

↓

Studio

Improve

↓

Office

Observe agents

↓

Blueprint

Understand dependencies

Navigation should preserve continuity between views.

---

# Future Navigation

Navigation must scale to support:

Multi-project workspaces

Multi-user collaboration

Live presence

Organization switching

External connectors

AI copilots

Mobile companion

Without redesigning the navigation system.

---

# Navigation Quality Checklist

Before approving navigation ask:

[ ] Can users identify where they are within 2 seconds?

[ ] Can users reach any major workspace within one action?

[ ] Is navigation visually quieter than the workspace?

[ ] Does navigation preserve context?

[ ] Does keyboard navigation cover every important workflow?

[ ] Does the interface feel like one operating system?

---

# Non-Negotiables

Never hide critical navigation.

Never create dead ends.

Never duplicate navigation in multiple places.

Never overload sidebars with workflow content.

Never interrupt users with unnecessary notifications.

Navigation should disappear into the background.

Users should remember their work—not how they reached it.

---

# Used By

Claude Chat

Claude Code

UX Reviews

Future Navigation Audits

Design System Evolution
