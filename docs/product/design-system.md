# Design System

> Status: **Target production UI system**

The design system should make the operational product consistent, accessible and fast to use.

## 1. Design Principles

1. State clarity over decoration.
2. Consistent action hierarchy.
3. Dense information where operations require it.
4. Strong distinction between human, AI, system and provider actions.
5. Accessibility as a component property, not a page afterthought.

## 2. Semantic Tokens

Define tokens for:

- background;
- surface;
- foreground;
- muted foreground;
- border;
- focus;
- primary action;
- destructive;
- warning;
- success;
- information;
- disabled.

Components consume semantic tokens rather than hard-coded values.

## 3. Primitive Layer

Core primitives:

~~~text
Button
Input
Textarea
Select
Checkbox
Radio
Dialog
Drawer
Popover
Tooltip
Tabs
Badge
Alert
Toast
Skeleton
Table
Pagination
Breadcrumb
Command
~~~

## 4. Operational Components

Examples:

~~~text
ConversationTimeline
ConversationStatus
ConversationControl
AssignmentPicker
SLAIndicator
AIAgentStatus
AIActionCard
ToolInvocation
ApprovalCard
WorkflowRunStatus
IntegrationHealth
EntitlementBanner
QualityScorecard
~~~

These components encode product semantics, not merely visual styles.

## 5. Component State Model

Every interactive component supports:

~~~mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> HOVER
    IDLE --> FOCUS
    IDLE --> DISABLED
    IDLE --> LOADING
    FOCUS --> ERROR
    LOADING --> SUCCESS
    LOADING --> ERROR
    SUCCESS --> IDLE
    ERROR --> IDLE
~~~

## 6. Accessibility

Components should provide:

- keyboard interaction;
- accessible names;
- correct focus order;
- visible focus state;
- adequate target size;
- screen-reader semantics;
- reduced-motion handling.

## 7. Status Representation

Do not rely only on color.

Example:

~~~text
[●] Connected
[!] Degraded
[x] Failed
[~] Processing
~~~

Icon + text is more robust than color alone.

## 8. Typography

Define a scale with predictable hierarchy:

~~~text
display
heading-1
heading-2
heading-3
body
small
caption
code
~~~

Operations tables should use legible text and clear row density.

## 9. Spacing

Use a spacing scale so:

- tables;
- forms;
- dialogs;
- navigation;
- cards

share consistent rhythm.

## 10. Motion

Motion communicates:

- transition;
- progress;
- acknowledgment.

Do not animate data-heavy tables excessively. Respect reduced-motion preferences.

## 11. Dark Mode

Dark mode is a semantic token transformation, not a separate set of arbitrary styles.

Information hierarchy must remain understandable in both themes.

## 12. Error Patterns

Use:

- inline validation for field errors;
- alert for section-level failures;
- toast for completed background notifications;
- persistent banners for degraded dependencies;
- dedicated failure state for blocked workflows.

Do not use toasts as the only way to communicate critical failures.

## 13. AI Visual Language

AI state should use consistent labels:

- AI suggested;
- AI executing;
- AI blocked;
- AI awaiting approval;
- AI handed off;
- Human control.

Do not imply certainty through decorative confidence meters.

## 14. Component Governance

A shared component is promoted only when:

- at least two product areas need it;
- behavior is stable;
- accessibility behavior is defined;
- API is documented;
- visual semantics are tokenized.

## 15. Acceptance Criteria

- All operational screens use semantic tokens.
- Component states are explicit.
- Status does not depend on color alone.
- AI/human/system actions are distinguishable.
- Accessibility behavior is part of component contracts.
- Dark/light theme semantics remain consistent.
