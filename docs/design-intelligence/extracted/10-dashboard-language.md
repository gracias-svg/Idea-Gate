# IDEAGATE

# Dashboard Language v1

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
- Motion Language
- Information Hierarchy
- AI Interaction Language
- Visualization Language

---

# Purpose

Dashboards answer one question:

"What requires my attention right now?"

Dashboards are decision surfaces.

They should summarize the state of the Product Operating System without overwhelming users.

Users should immediately understand

Current health

Current risks

Current progress

Recommended next actions

---

# Dashboard Philosophy

Mission Control is not an analytics page.

It is an operational command center.

Every widget should answer a meaningful operational question.

If a widget cannot influence a decision, it should not exist.

---

# Primary Objectives

Mission Control should enable users to

Monitor

Prioritize

Investigate

Act

Review

Forecast

without leaving the dashboard unnecessarily.

---

# Dashboard Hierarchy

Priority 1

Critical Issues

Priority 2

Overall Health

Priority 3

Execution Progress

Priority 4

Team Activity

Priority 5

Historical Trends

Never reverse this order.

---

# Above-the-Fold Layout

The first screen should display only:

Current Project

Lifecycle Stage

Overall Health

Critical Alerts

Current Recommendation

Everything else appears below.

---

# Dashboard Sections

## Executive Summary

Always visible.

Should include

Project

Stage

Status

Overall health

Risk level

Recommendation

Time of last update

---

## Health Overview

Summarizes

Lifecycle completion

Artifact completeness

Validation quality

Execution stability

Dependency health

Health should be represented as a composite score rather than a single metric.

---

## Active Work

Displays

Running agents

Current tasks

Queued work

Pending reviews

Blocked stages

Users should understand current execution instantly.

---

## Critical Alerts

Always sorted by impact.

Examples

Blocked lifecycle

Failed validation

Missing artifact

Dependency conflict

High AI uncertainty

Critical alerts should remain visible until acknowledged or resolved.

---

## Recommendations

Mission Control should recommend

Highest-priority action

Reason

Expected impact

Estimated effort

Confidence

Every recommendation must include supporting evidence.

---

## Progress

Progress should answer

How far have we come?

How much remains?

What is blocking completion?

Avoid isolated percentage indicators.

Progress should always include context.

---

## Dependencies

Display

Critical dependency chains

Broken dependencies

Recently resolved dependencies

Upcoming dependencies

Only important relationships should appear.

---

## Team Activity

Summarize

Coordinator

Research

UX

Architecture

QA

Strategy

Users should see contribution, not raw logs.

---

## Recent Events

Display meaningful events.

Examples

Artifact approved

Review completed

Stage advanced

Validation failed

Avoid showing every internal action.

---

## Historical Trends

Examples

Quality trend

Velocity trend

Completion trend

Risk trend

Cost trend

Trends explain direction.

Not individual events.

---

# Widget Principles

Every widget answers one question.

Every widget contains one primary visualization.

Every widget supports drill-down.

Avoid combining unrelated metrics.

---

# Widget Priority

Critical widgets

Largest

Operational widgets

Medium

Historical widgets

Small

Decorative widgets

Do not exist.

---

# Drill-Down Behaviour

Every summary should open detailed views.

Example

Blocked Stage

↓

Validation Report

↓

Affected Artifact

↓

Review

↓

Suggested Fix

Dashboards summarize.

Workspaces resolve.

---

# KPI Philosophy

KPIs should represent outcomes.

Not activity.

Good

Artifacts Approved

Lifecycle Progress

Execution Health

Quality Score

Bad

Clicks

Requests

Button Presses

---

# AI Dashboard Behaviour

AI should continuously evaluate

Risk

Execution

Quality

Coverage

Confidence

AI should recommend priorities without taking action automatically.

---

# Alert Philosophy

Alerts should be

Actionable

Prioritized

Explainable

Temporary

Avoid permanent warning banners.

---

# Dashboard Filters

Support

Project

Lifecycle Stage

Agent

Artifact

Time Range

Status

Filters should never hide critical alerts.

---

# Dashboard Refresh

Refresh should feel live.

Only changed information should animate.

Avoid full-page refreshes.

Maintain user orientation.

---

# Empty Dashboards

If no project is active

Explain

Why

What to do next

Provide a clear entry point.

Never display an empty analytics page.

---

# Dashboard Quality Checklist

Before approving a dashboard ask

[ ] Can users understand project health within five seconds?

[ ] Are critical issues impossible to miss?

[ ] Does every widget support a decision?

[ ] Are trends meaningful?

[ ] Can users investigate every metric?

[ ] Is visual noise minimized?

[ ] Does the dashboard feel operational rather than analytical?

---

# Non-Negotiables

Never create dashboards to impress.

Never show metrics without context.

Never prioritize visual complexity over operational clarity.

Never overload the first screen.

Dashboards exist to support rapid decision-making.

---

# Used By

Mission Control

Executive Overview

Claude Chat

Claude Code

Future Operations Center

Dashboard Reviews