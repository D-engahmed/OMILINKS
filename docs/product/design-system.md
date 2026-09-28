# Design System — Implementation Contract

> Status: **Target production UI system**

## 1. Architecture

The design system has three layers:

~~~text
tokens
 -> primitives
   -> semantic product components
     -> screens
~~~

## 2. Token System

Semantic tokens:

~~~text
surface
surface-muted
foreground
foreground-muted
border
focus
primary
success
warning
danger
info
disabled
~~~

Components must use tokens, not page-specific colors.

## 3. Primitives

Examples:

~~~text
Button
Input
Textarea
Select
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
Command
~~~

## 4. Product Components

Examples:

~~~text
ConversationTimeline
ConversationControl
AssignmentPicker
SLAIndicator
AIActionCard
ToolInvocation
ApprovalCard
WorkflowRunStatus
IntegrationHealth
EntitlementBanner
QualityScorecard
~~~

These components encode business semantics.

## 5. Component Contract

Each component defines:

- inputs;
- outputs/events;
- loading;
- disabled;
- error;
- focus behavior;
- keyboard behavior;
- responsive behavior;
- accessibility behavior.

## 6. Status Semantics

Use text + icon, not color alone.

Example:

~~~text
[check] Connected
[warning] Degraded
[x] Failed
[spinner] Processing
[clock] Awaiting Approval
[human] Human Control
[bot] AI Control
~~~

## 7. Typography

Define a stable scale:

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

Operations tables prioritize legibility over decorative typography.

## 8. Spacing

Use a shared spacing scale across navigation, forms, tables and dialogs.

## 9. Motion

Motion communicates state transition and feedback.

Avoid animation that obscures rapidly changing operational data.

Respect reduced-motion preferences.

## 10. Themes

Light/dark are token transformations.

Do not maintain two unrelated visual systems.

## 11. RTL

The product must support Arabic layouts.

Components must avoid:

- hardcoded left/right assumptions;
- directional icons without mirroring rules;
- fixed text alignment;
- layout logic that assumes LTR.

Use logical properties where possible.

## 12. AI Visual Language

Standard states:

~~~text
AI Suggested
AI Executing
AI Blocked
AI Awaiting Approval
AI Handed Off
Human Control
~~~

Do not display false precision such as arbitrary confidence percentages.

## 13. Accessibility

Target WCAG 2.2 AA practices:

- keyboard navigation;
- visible focus;
- semantic structure;
- correct labels;
- status announcements;
- sufficient contrast;
- reduced motion.

## 14. Governance

Promote a shared component only when:

- reused;
- behavior stable;
- accessibility specified;
- API documented;
- tokens defined;
- tests exist.

## 15. Testing

Component tests include:

~~~text
render
interaction
keyboard
focus
loading
error
disabled
responsive
RTL
theme
accessibility
~~~

## 16. Acceptance

A component is production-ready when semantics, accessibility, state behavior and theme/RTL behavior are specified and tested—not merely visually correct.
