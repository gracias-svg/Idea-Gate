Below is that skeleton, with no low‑level technical detail—only roles, responsibilities, stage‑wise hand‑offs, and artifacts.

1. Overall concept
System goal:

Take a rough product idea and autonomously walk it through the full 0–18 lifecycle (your ruler) to produce all key artifacts: discovery briefs, 1‑pager, concepts, hypotheses, validation summary, roadmap slice, PRD, UX flows, architecture sketch, backlog, GTM brief, launch plan, and iteration plan.
​

Team structure:

One Orchestrator / Coordinator agent (the “showrunner”).

Several role agents (Researcher, Senior PM, Designer, Architect/Engineer, Data, PMM/Marketer, QA/Delivery Coach).

All agents read from the same Lifecycle Ruler Knowledge Base (your spec) so they know which stage they’re in, what artifacts to produce, and what “job done” means.
​

2. Core agents and their charters
2.1 Orchestrator Agent (Lead PM / Showrunner)
Mandate:

Own the stage machine (0 → 18).

Decide which stage to run next.

Assign work to role‑agents.

Perform final review and generate canonical documentation at each stage.
​
​

Inputs:

Raw idea from user/CEO.

Lifecycle ruler spec (the table + JSON/YAML).

Outputs:

Stage‑by‑stage artifact checklist.

Final, cleaned docs: discovery brief, 1‑pager, PRD, GTM brief, post‑launch readout, etc.

2.2 Researcher Agent (Discovery + Validation)
Mandate:

Own stages 1, 5, parts of 2 and 9 and 17 from a research lens.
​
​

Responsibilities:

Stage 1: generate market scan, competitor mapping (including four‑level competition), target user hypotheses, JTBD‑style interview guides.

Stage 2: help PM sharpen problem statement and assumptions.

Stage 5: propose validation experiments, surveys, fake‑door tests, and summarize findings.

Stage 9 & 17: propose usability and post‑launch study plans; summarize qualitative insights.

Inputs:

Idea, orchestrator brief, lifecycle definitions.

Outputs (structured):

discovery_brief, market_competitive_snapshot, user_research_summary, validation_summary, post_launch_insights.
​

2.3 Senior PM Agent (Strategy + Product Lens)
Mandate:

Own the product thinking across all stages; be the “brains” behind problem framing, solution bets, and prioritization.
​

Responsibilities:

Stage 0: structure the idea into a clean log entry.

Stage 1–2: refine discovery outputs into a problem 1‑pager.

Stage 3–4: guide solution ideation and formulate hypotheses and MVP outcomes.

Stage 5–6: interpret validation, create business case, run prioritization logic (RICE vs MoSCoW vs Kano selection).

Stage 7: draft PRD skeleton and epics.

Stage 11: define release slices and success criteria.

Stage 14–15–17–18: partner with PMM on metrics, decisions, and iteration plan.

Outputs:

problem_one_pager, solution_concept_doc, mvp_hypothesis_sheet, validation_decision, prioritized_initiative_entry, prd, release_plan, post_launch_readout, iteration_backlog.
​

2.4 Designer / UX Agent
Mandate:

Own user experience stages 3, 8, 9, 18 (UX).
​

Responsibilities:

Stage 3: turn PM concepts into user flows and basic storyboards.

Stage 8: create end‑to‑end journey maps, IA, and low‑fi wireframes.

Stage 9: propose high‑fi flows and usability test plans (abstract, not Figma‑specific).

Stage 18: propose UX experiments/iterations based on learnings.

Outputs:

concept_flows, journey_map, ia_diagram, low_fi_wireframes_description, usability_test_plan, ux_iteration_ideas.
​

2.5 Architect / Engineer Agent
Mandate:

Own technical feasibility and architecture stages 10, 11 (tech), 12 (conceptual), 13 (risk view), 16 (high‑level rollout).
​
​

Responsibilities:

Stage 1–2 (advisory): call out major tech constraints early if relevant.

Stage 10: propose system architecture, data model, and API contracts at conceptual level.

Stage 11: highlight dependencies and sequencing; estimate at a rough level (t‑shirt).

Stage 12–13–16: define what “ready” means technically (DoD, test focus, rollout strategy).

Outputs:

architecture_overview, data_model_sketch, api_contracts_outline, tech_risk_log, dependency_map, technical_readiness_criteria.
​

2.6 Data / Analytics Agent
Mandate:

Own all metrics, experiments, and analysis stages 4, 5, 11 (for feasibility), 14 (success metrics), 17–18.
​
​

Responsibilities:

Stage 4: refine PM’s hypotheses into measurable metrics.

Stage 5: design validation experiment metrics and sample‑size thinking (conceptual).

Stage 11: advise on tracking feasibility and instrumentation slices.

Stage 14: define launch success metrics & leading indicators.

Stage 17–18: produce analytics narrative, experiment designs, and iteration ideas.

Outputs:

metrics_definition, experiment_designs, dashboards_spec, analytics_readout, iterative_experiments_list.
​

2.7 PMM / Marketer Agent
Mandate:

Own GTM and narrative stages 14–16–17 (GTM lens).
​
​

Responsibilities:

Stage 14: define positioning, messaging, pricing/packaging, launch tier, channels.

Stage 15: ensure GTM readiness and enablement assets.

Stage 16: define comms plan and success tracking from GTM perspective.

Stage 17: interpret performance vs GTM hypothesis.

Outputs:

gtm_brief, positioning_statement, pricing_packaging_outline, launch_plan, enablement_assets_outline, gtm_performance_summary.
​

2.8 QA / Delivery Coach Agent
Mandate:

Own quality, risk, and agile process stages 11–13–15–16 from a delivery lens.
​

Responsibilities:

Stage 11: propose release slices and risk‑aware sequencing.

Stage 12: define DoR/DoD, sprint cadence expectations (conceptual; no tooling).

Stage 13: propose test strategy, bug triage policy, and UAT plan.

Stage 15–16: define readiness checklist, rollout/rollback plan at conceptual level.

Outputs:

delivery_playbook, test_strategy_outline, bug_triage_policy, readiness_checklist, rollout_rollback_plan.
​

3. Stage‑wise orchestration flow
Think of this as a recipe the Orchestrator follows; at each stage it calls specific agents and expects specific artifacts.

Stage 0: Intake
Orchestrator:

Receives raw idea; normalizes it into the idea log format.

Agents:

Senior PM: helps clarify idea into problem vs feature.

Artifact: idea_entry.

Stage 1: Discovery & problem framing
Orchestrator:

Calls Researcher and Senior PM with idea_entry.

Agents:

Researcher: produces discovery_brief, market_competitive_snapshot, user_research_plan_or_synthesis.

Senior PM: drafts early problem_hypotheses.

Orchestrator:

Checks against lifecycle exit criteria; merges into a single discovery_package.

Stage 2: Problem definition & 1‑pager
Orchestrator → Senior PM + Researcher:

Inputs: discovery_package.

Senior PM:

Produces problem_one_pager + assumption_map.

Researcher:

Validates assumptions against data and user signals.

Orchestrator:

Approves problem_one_pager as canonical artifact.

Stage 3: Concept & solution ideation
Orchestrator → Senior PM + Designer + Architect:

Inputs: problem_one_pager.

Designer:

Produces 2–3 solution_flows_concepts.

Architect:

Comments on feasibility of each concept.

Senior PM:

Produces solution_concept_doc with chosen concept + trade‑offs.

Orchestrator:

Finalizes solution_concept_doc.

Stage 4: MVP hypothesis & value definition
Orchestrator → Senior PM + Data:

Inputs: solution_concept_doc.

Senior PM:

Drafts hypotheses and expectations.

Data:

Turns them into metrics_definition and mvp_success_criteria.

Orchestrator:

Approves mvp_hypothesis_sheet.

Stage 5: Research, validation & sizing
Orchestrator → Researcher + Data + Senior PM:

Inputs: mvp_hypothesis_sheet.

Researcher:

Proposes validation_experiments.

Data:

Adds measurement plan and success thresholds.

Senior PM:

Writes validation_decision and lean_business_case.

Orchestrator:

Approves validation_summary (go/kill/reshape).

Stage 6: Prioritization & roadmap framing
Orchestrator → Senior PM:

Inputs: validation_summary + context about other initiatives (assumed global).

Senior PM:

Applies RICE, MoSCoW, Kano logic; produces prioritized_initiative_entry.

Orchestrator:

Marks stage 6 exit and records roadmap slot (conceptually).

Stage 7: Detailed scope & PRD
Orchestrator → Senior PM + Architect + Designer:

Inputs: prioritized_initiative_entry.

Senior PM:

Writes prd structure: epics, high‑level stories, non‑functional requirements.

Architect:

Adds tech constraints and requirements.

Designer:

Adds UX requirements.

Orchestrator:

Produces final prd_document.

Stage 8–9: UX flows and high‑fi intent
Orchestrator → Designer + Senior PM + Researcher:

Inputs: prd_document.

Designer:

Produces journey_map, ia_diagram, low_fi_wireframes_description (Stage 8) and high_fi_flows_description, usability_test_plan (Stage 9).

Researcher:

Validates test plan logic.

Senior PM:

Confirms flows align with problem.

Orchestrator:

Consolidates into ux_spec_package.

Stage 10: Technical discovery & architecture
Orchestrator → Architect + Senior PM:

Inputs: prd_document, ux_spec_package.

Architect:

Produces architecture_overview, data_model_sketch, api_contracts_outline, tech_risk_log.

Senior PM:

Confirms business constraints are respected.

Orchestrator:

Approves architecture_package.

Stage 11: Backlog creation & release planning
Orchestrator → Senior PM + Architect + QA/Delivery:

Inputs: architecture_package, prd_document.

Senior PM:

Creates epics_and_story_outline, release_slices.

Architect + QA/Delivery:

Add dependencies, risk_based_slicing, high‑level DoR/DoD.

Orchestrator:

Outputs release_plan and backlog_outline.

Stage 12–13: Implementation intent, QA & hardening plan
Orchestrator → QA/Delivery + Architect + Senior PM:

Focus is conceptual delivery playbook, not code.

QA/Delivery:

Produces delivery_playbook, test_strategy_outline, bug_triage_policy.

Architect:

Adds technical_readiness_criteria.

Orchestrator:

Approves implementation_and_quality_plan.

Stage 14–15–16: GTM, readiness, launch plan
Orchestrator → PMM/Marketer + Senior PM + Data + QA/Delivery:

Inputs: prd_document, mvp_hypothesis_sheet, release_plan.

PMM:

Produces gtm_brief, positioning_statement, pricing_packaging_outline, launch_plan.

Data:

Defines launch success metrics and leading indicators.

QA/Delivery:

Provides readiness_checklist, rollout_rollback_plan.

Orchestrator:

Produces launch_readiness_package.

Stage 17–18: Post‑launch measurement & iteration plan
Orchestrator → Data + Researcher + Senior PM + Designer:

Inputs: all upstream artifacts + assumed “results snapshot”.

Data:

Drafts analytics_readout.

Researcher:

Summarizes qualitative insights.

Designer:

Suggests ux_iteration_ideas.

Senior PM:

Writes post_launch_readout and iteration_backlog.

Orchestrator:

Produces final iteration_and_learnings_package and restarts loop at Stage 1/2 if needed.
​

4. Universal implementation guidance (for OCC, AutoGen, Agent Swarm, etc.)
Use your Lifecycle Ruler as the central knowledge file, shared read‑only by all agents.
​
​

Implement the Orchestrator as the only component allowed to:

Advance the stage number.

Accept/reject intermediate outputs.

Write the final canonical artifacts.

Implement each role agent with:

A fixed stage map (e.g., Researcher is primary for 1, 5, 9, 17).

A clear list of expected inputs and standardized outputs (names above).

Reference to the ruler so they know which frameworks to consider at each stage.

Keep the plan platform‑agnostic: no assumptions about tools (just “this agent reads X, writes Y, and calls Z frameworks in its reasoning”).


List the agents in the right sequence, &  the full JSON spec.

Below is a clean, final, stage‑aligned definition of the 7 agents and a pure JSON spec with: agents, responsibilities, inputs, outputs, and the stage matrix.
​

I’ve ordered agents by how the work actually flows from 0→MVP: strategy → research → UX → engineering → data → GTM, with Coordinator on top.

1. Agent names and roles (final, 7 agents)
0. CoordinatorAgent – Orchestrator & Master Document Owner

PM lens: all lenses, across all stages.

Role:

Own the lifecycle state (0–18), decide which stage runs next.

Route work to specialist agents.

Apply exit criteria from the ruler.

Write and maintain the final, canonical documentation for each stage (idea log, discovery brief, problem 1‑pager, PRD, prototype spec, etc.).
​

1. ProductStrategyAgent – Senior PM / Strategy & PRD

PM lens: problem space → solution space → portfolio → requirements → iteration.
​
​

Core work:

Stage 0–2: idea structuring, problem framing, assumption mapping.

Stage 3–4: solution concept, MVP hypotheses.

Stage 5–7: validation decision, prioritization framing, PRD and epics.

Stage 11–13: release intentions, PM‑side DoR/DoD, “ready for prototype”.

Stage 17–18: post‑launch narrative and iteration backlog (for later).

2. DiscoveryResearchAgent – Market / User / Validation Research

PM lens: problem space, risk reduction, usability insights.
​
​

Core work:

Stage 1–2: discovery brief, market + competition, JTBD, user research plan/synthesis.

Stage 5: validation experiments (qual), research‑view on go/kill.

Stage 9: usability test plan and findings (conceptual).

Stage 17: structured qualitative feedback (later).

3. UXDesignAgent – UX Flows, IA, UX Experiments

PM lens: UX, usability, desirability.
​

Core work:

Stage 3: concept flows and storyboards.

Stage 8: journey maps, IA, low‑fi wireframe intent.

Stage 9: high‑fi intent description, usability scenarios.

Stage 18: UX iteration ideas (later).

4. EngineeringDeliveryAgent – Architecture + Code + Integrations

PM lens: feasibility, delivery, technical quality.
​
​

Core work:

Stage 1 & 3: early feasibility constraints.

Stage 10: architecture, data model, API definitions, integration plan, MCP/tools.

Stage 11–13: engineering prototype spec, technical DoR/DoD, tech‑debt, rollout/rollback at prototype level.

Owner of: APIs, MCP integrations, code‑level spec, debugging and refactor plan.

5. DataAnalyticsAgent – Metrics, Experiments, Analytics

PM lens: impact & bets, outcome validation, continuous improvement.
​

Core work:

Stage 4: metrics definition, success thresholds.

Stage 5: quant view on validation.

Stage 11: instrumentation feasibility.

Stage 16–18: analytics readout & experiment ideas (when enabled).

6. GTMMarketingAgent – GTM & Product Marketing (toggleable)

PM lens: market readiness, GTM execution.
​
​

Core work:

Stage 14–15: GTM brief, positioning, pricing/packaging outline, launch tier, readiness.

Stage 16–17: launch plan, GTM performance summary (when enabled).

Total: 7 agents, with Coordinator on top and the other six in logical lifecycle order.

2. Multi‑agent system spec (JSON):

{
  "system_name": "ProductBuilderCoworker_MVP",
  "description": "Multi-agent system that takes a raw idea through a structured product lifecycle (0–18), up to a high-quality MVP prototype, with optional GTM extension.",
  "lifecycle_reference": "product_lifecycle_ruler (stages 0–18)",
  "agents": [
    {
      "id": "CoordinatorAgent",
      "role_name": "Coordinator / Lead PM",
      "toggleable": false,
      "primary_stages": ["0-18"],
      "responsibilities": [
        "Maintain current lifecycle stage, domain tag, and exit criteria from the ruler.",
        "Decide which stage to run next and which specialist agents to invoke.",
        "Provide each agent with stage definitions, required artifacts, and constraints.",
        "Review specialist agents' outputs against stage exit criteria.",
        "Resolve conflicts between agent recommendations.",
        "Write and maintain final canonical documents per stage (e.g., final discovery brief, problem one-pager, PRD, prototype spec, GTM brief).",
        "Control on/off toggles for optional stages and agents (e.g., GTMMarketingAgent for stages 14–17)."
      ],
      "inputs": [
        "raw_product_idea",
        "product_lifecycle_ruler_spec",
        "previous_stage_artifacts",
        "specialist_agent_outputs"
      ],
      "outputs": [
        "stage_plan",
        "approved_stage_artifacts",
        "canonical_documents_per_stage",
        "stage_transition_log"
      ]
    },
    {
      "id": "ProductStrategyAgent",
      "role_name": "Product Strategy (Senior PM)",
      "toggleable": false,
      "primary_stages": ["0", "1", "2", "3", "4", "5", "6", "7", "11", "12", "13", "17", "18"],
      "pm_lens": [
        "Problem space",
        "Solution space",
        "Portfolio trade-offs",
        "Requirements clarity",
        "Execution & quality (PM view)",
        "Outcome validation & iteration"
      ],
      "responsibilities": [
        "Stage 0: Normalize raw idea into structured idea_entry and align with opportunity backlog.",
        "Stage 1–2: Use discovery outputs to create problem_one_pager and assumption_map.",
        "Stage 3: Choose preferred solution concept with trade-offs and document solution_concept_doc.",
        "Stage 4: Define MVP hypotheses and outcomes in mvp_hypothesis_sheet.",
        "Stage 5: Interpret validation evidence, write validation_decision and lean_business_case.",
        "Stage 6: Apply prioritization frameworks (RICE, MoSCoW, Kano, Impact vs Effort) to produce prioritized_initiative_entry.",
        "Stage 7: Write PRD (prd_document) including epics, high-level stories, NFRs.",
        "Stage 11: Define prototype release slices and PM-side success conditions.",
        "Stage 12–13: Define PM-side DoR/DoD and what 'prototype ready' means.",
        "Stage 17–18 (when enabled): Write post_launch_readout and iteration_backlog."
      ],
      "frameworks_applied": [
        { "name": "Problem_framing_templates", "stages": ["2"] },
        { "name": "JTBD_statements", "stages": ["2"] },
        { "name": "Assumption_mapping", "stages": ["2", "4", "5"] },
        { "name": "Hypothesis_templates", "stages": ["4"] },
        { "name": "RICE", "stages": ["6"] },
        { "name": "MoSCoW", "stages": ["6", "7", "11"] },
        { "name": "Kano", "stages": ["6"] },
        { "name": "Impact_vs_Effort", "stages": ["6", "18"] }
      ],
      "inputs": [
        "raw_product_idea",
        "stage_definition_from_ruler",
        "DiscoveryResearchAgent_outputs",
        "UXDesignAgent_outputs",
        "EngineeringDeliveryAgent_outputs",
        "DataAnalyticsAgent_outputs",
        "GTMMarketingAgent_outputs"
      ],
      "outputs": [
        "idea_entry",
        "problem_one_pager",
        "assumption_map",
        "solution_concept_doc",
        "mvp_hypothesis_sheet",
        "validation_decision_and_business_case",
        "prioritized_initiative_entry",
        "prd_document",
        "prototype_release_plan_outline",
        "pm_side_DoR_DoD",
        "post_launch_readout",
        "iteration_backlog"
      ]
    },
    {
      "id": "DiscoveryResearchAgent",
      "role_name": "Discovery & Research",
      "toggleable": false,
      "primary_stages": ["1", "2", "5", "9", "17"],
      "pm_lens": [
        "Problem space",
        "Risk reduction",
        "Usability insights"
      ],
      "responsibilities": [
        "Stage 1: Produce discovery_brief and market_competitive_snapshot using PESTEL, Porter, SWOT, JTBD/Mom Test, Opportunity Solution Tree.",
        "Stage 2: Help refine problem_one_pager and assumption_map with research evidence.",
        "Stage 5: Propose validation_experiments_outline and write research_view in validation_summary.",
        "Stage 9: Outline usability_test_plan and usability_findings_summary.",
        "Stage 17 (when enabled): Synthesize post_launch_qualitative_insights from feedback."
      ],
      "frameworks_applied": [
        { "name": "PESTEL", "stages": ["1"] },
        { "name": "Porter_Five_Forces_and_four_level_competition", "stages": ["1"] },
        { "name": "SWOT", "stages": ["1"] },
        { "name": "JTBD_and_Mom_Test", "stages": ["1", "2"] },
        { "name": "Opportunity_Solution_Tree", "stages": ["1"] }
      ],
      "inputs": [
        "raw_product_idea",
        "stage_definition_from_ruler",
        "idea_entry",
        "previous_discovery_artifacts"
      ],
      "outputs": [
        "discovery_brief",
        "market_competitive_snapshot",
        "user_research_plan_or_summary",
        "assumption_evidence_comments",
        "validation_experiments_outline",
        "validation_summary_research_section",
        "usability_test_plan",
        "usability_findings_summary",
        "post_launch_qualitative_insights"
      ]
    },
    {
      "id": "UXDesignAgent",
      "role_name": "UX / Product Design",
      "toggleable": false,
      "primary_stages": ["3", "8", "9", "18"],
      "pm_lens": [
        "Solution space (UX)",
        "User experience",
        "Usability & desirability",
        "Continuous improvement (UX side)"
      ],
      "responsibilities": [
        "Stage 3: Translate solution_concept_doc into concept_storyboards_and_flows.",
        "Stage 8: Create journey_map, ia_diagram, and low_fi_wireframes_description aligned to PRD.",
        "Stage 9: Create high_fi_flows_intent_description and refine usability_test_plan with DiscoveryResearchAgent.",
        "Stage 18 (when enabled): Provide ux_iteration_ideas based on data and feedback."
      ],
      "frameworks_applied": [
        { "name": "User_journey_maps_and_service_blueprints", "stages": ["8"] },
        { "name": "Flow_diagrams_and_state_diagrams", "stages": ["3", "8"] },
        { "name": "Nielsen_usability_heuristics", "stages": ["8", "9"] },
        { "name": "Design_Thinking_Double_Diamond", "stages": ["3"] }
      ],
      "inputs": [
        "problem_one_pager",
        "solution_concept_doc",
        "prd_document",
        "stage_definition_from_ruler",
        "usability_findings_summary"
      ],
      "outputs": [
        "concept_storyboards_and_flows",
        "journey_map",
        "ia_diagram",
        "low_fi_wireframes_description",
        "high_fi_flows_intent_description",
        "ux_iteration_ideas"
      ]
    },
    {
      "id": "EngineeringDeliveryAgent",
      "role_name": "Engineering & Delivery (Architecture + Code + Integration)",
      "toggleable": false,
      "primary_stages": ["1", "3", "10", "11", "12", "13", "15", "16", "18"],
      "pm_lens": [
        "Feasibility & architecture",
        "Execution planning",
        "Delivery & scope control",
        "Quality & risk",
        "Operational alignment",
        "Continuous improvement (tech-debt & refactor)"
      ],
      "responsibilities": [
        "Stage 1 & 3: Provide early feasibility and constraint notes on concepts.",
        "Stage 10: Produce architecture_overview, data_model_sketch, api_contracts_outline, and integration_plan including MCP/tools/APIs.",
        "Stage 11: Produce dependency_map, effort_estimate_ranges, and engineering_prototype_spec suited for tools like Lovable, v0.dev, Base44.",
        "Stage 12: Define technical_DoR_DoD and prototype_build_expectations (code-level details abstracted but clear).",
        "Stage 13: Define prototype_test_strategy and contribute to tech_risk_log and tech_debt_register.",
        "Stage 15–16 (when enabled): Draft technical parts of readiness_checklist and technical_rollout_and_rollback_outline.",
        "Stage 18 (when enabled): Add tech_debt_register_entries and refactor suggestions."
      ],
      "frameworks_applied": [
        { "name": "Architecture_review_checklist", "stages": ["10"] },
        { "name": "Spike_tickets", "stages": ["10"] },
        { "name": "Risk_matrix_technical", "stages": ["10", "11", "13"] },
        { "name": "Scrum_Kanban_delivery_principles", "stages": ["11", "12", "13"] }
      ],
      "inputs": [
        "problem_one_pager",
        "solution_concept_doc",
        "prd_document",
        "journey_map",
        "stage_definition_from_ruler"
      ],
      "outputs": [
        "architecture_overview",
        "data_model_sketch",
        "api_contracts_outline",
        "integration_plan",
        "dependency_map",
        "effort_estimate_ranges",
        "engineering_prototype_spec",
        "technical_DoR_DoD",
        "prototype_test_strategy",
        "tech_risk_log",
        "tech_debt_register_entries",
        "technical_rollout_and_rollback_outline"
      ]
    },
    {
      "id": "DataAnalyticsAgent",
      "role_name": "Data & Analytics",
      "toggleable": false,
      "primary_stages": ["4", "5", "11", "14", "16", "17", "18"],
      "pm_lens": [
        "Impact & bets",
        "Risk reduction (quant)",
        "Outcome validation",
        "Continuous improvement"
      ],
      "responsibilities": [
        "Stage 4: Turn mvp_hypothesis_sheet into metrics_definition and success thresholds.",
        "Stage 5: Provide validation_results_numbers_view and interpretation.",
        "Stage 11: Outline measurement_plan and instrumentation feasibility by release slice.",
        "Stage 14 (when enabled): Define launch_success_metrics_and_targets.",
        "Stage 16–17 (when enabled): Produce analytics_readout of early impact.",
        "Stage 18 (when enabled): Provide iteration_experiment_suggestions."
      ],
      "frameworks_applied": [
        { "name": "North_Star_and_input_metrics", "stages": ["4"] },
        { "name": "AARRR", "stages": ["5", "17"] },
        { "name": "HEART", "stages": ["17"] },
        { "name": "AB_and_multivariate_testing", "stages": ["5", "16", "18"] }
      ],
      "inputs": [
        "mvp_hypothesis_sheet",
        "validation_experiments_outline",
        "prd_document",
        "gtm_brief",
        "launch_results_snapshot",
        "stage_definition_from_ruler"
      ],
      "outputs": [
        "metrics_definition",
        "experiment_designs",
        "validation_results_numbers_view",
        "measurement_plan",
        "launch_success_metrics_and_targets",
        "analytics_readout",
        "iteration_experiment_suggestions"
      ]
    },
    {
      "id": "GTMMarketingAgent",
      "role_name": "GTM & Product Marketing",
      "toggleable": true,
      "primary_stages": ["14", "15", "16", "17"],
      "pm_lens": [
        "Market readiness",
        "Execution & monitoring (GTM lens)"
      ],
      "responsibilities": [
        "Stage 14: Produce gtm_brief, positioning_statement, pricing_packaging_outline, and launch_tier_selection.",
        "Stage 15: Contribute GTM portions to readiness_checklist and enablement outlines.",
        "Stage 16: Define launch_plan and how GTM impact will be observed.",
        "Stage 17 (when enabled): Provide gtm_performance_summary and suggestions for GTM iteration."
      ],
      "frameworks_applied": [
        { "name": "4Ps_marketing_mix", "stages": ["14"] },
        { "name": "Positioning_statement_template", "stages": ["14"] },
        { "name": "Launch_tier_matrix", "stages": ["14"] }
      ],
      "inputs": [
        "problem_one_pager",
        "solution_concept_doc",
        "validation_decision_and_business_case",
        "mvp_hypothesis_sheet",
        "prd_document",
        "launch_results_snapshot",
        "stage_definition_from_ruler"
      ],
      "outputs": [
        "gtm_brief",
        "positioning_statement",
        "pricing_packaging_outline",
        "launch_tier_selection",
        "launch_plan",
        "sales_enablement_outline",
        "support_enablement_outline",
        "gtm_performance_summary"
      ]
    }
  ],
  "stage_agent_matrix": {
    "0": ["CoordinatorAgent", "ProductStrategyAgent"],
    "1": ["CoordinatorAgent", "ProductStrategyAgent", "DiscoveryResearchAgent", "EngineeringDeliveryAgent"],
    "2": ["CoordinatorAgent", "ProductStrategyAgent", "DiscoveryResearchAgent"],
    "3": ["CoordinatorAgent", "ProductStrategyAgent", "UXDesignAgent", "EngineeringDeliveryAgent"],
    "4": ["CoordinatorAgent", "ProductStrategyAgent", "DataAnalyticsAgent"],
    "5": ["CoordinatorAgent", "ProductStrategyAgent", "DiscoveryResearchAgent", "DataAnalyticsAgent"],
    "6": ["CoordinatorAgent", "ProductStrategyAgent"],
    "7": ["CoordinatorAgent", "ProductStrategyAgent", "EngineeringDeliveryAgent"],
    "8": ["CoordinatorAgent", "UXDesignAgent", "ProductStrategyAgent"],
    "9": ["CoordinatorAgent", "UXDesignAgent", "DiscoveryResearchAgent", "ProductStrategyAgent"],
    "10": ["CoordinatorAgent", "EngineeringDeliveryAgent", "ProductStrategyAgent"],
    "11": ["CoordinatorAgent", "ProductStrategyAgent", "EngineeringDeliveryAgent", "DataAnalyticsAgent"],
    "12": ["CoordinatorAgent", "ProductStrategyAgent", "EngineeringDeliveryAgent"],
    "13": ["CoordinatorAgent", "ProductStrategyAgent", "EngineeringDeliveryAgent"],
    "14": ["CoordinatorAgent", "GTMMarketingAgent", "ProductStrategyAgent", "DataAnalyticsAgent"],
    "15": ["CoordinatorAgent", "ProductStrategyAgent", "EngineeringDeliveryAgent", "GTMMarketingAgent"],
    "16": ["CoordinatorAgent", "EngineeringDeliveryAgent", "GTMMarketingAgent", "DataAnalyticsAgent"],
    "17": ["CoordinatorAgent", "ProductStrategyAgent", "DiscoveryResearchAgent", "DataAnalyticsAgent", "GTMMarketingAgent"],
    "18": ["CoordinatorAgent", "ProductStrategyAgent", "UXDesignAgent", "EngineeringDeliveryAgent", "DataAnalyticsAgent"]
  },
  "mvp_focus": {
    "active_stages": ["0","1","2","3","4","5","6","7","8","9","10","11","12","13"],
    "optional_stages": ["14","15","16","17","18"]
  }
}
