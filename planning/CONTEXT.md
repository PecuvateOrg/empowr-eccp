# Planning Workspace

This workspace turns Empowr's ECCP programme intent into an implementable product.

## Areas

| Directory | Purpose |
|---|---|
| `spec/` | Product scope, user journeys, requirements, and acceptance criteria |
| `architecture/` | System boundaries, request lifecycles, integrations, and data design |
| `decisions/` | Dated architectural decision records |

## Process

1. Confirm programme requirements and user roles with Empowr.
2. Define measurable acceptance criteria in `spec/`.
3. Record system boundaries and external dependencies in `architecture/`.
4. Capture consequential choices as decision records before implementation.

## Inputs and Outputs

- In: Empowr CIC KB facts, stakeholder decisions, and observed user needs
- Out: scoped, testable work ready for implementation in `src/`

## Constraints

- Certification must remain distinct from appointment to an operational coaching role.
- Do not select authentication, database, payment, or learning services without recording the decision.
