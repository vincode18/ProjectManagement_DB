# Rebranding: Project Management Dashboard → Workzen

## Summary

The app is rebranded from "Project Management Dashboard" to **Workzen**, distributed **By ViandraLabs**. This document tracks what changed and where.

## What changed

| Area | Before | After | File |
| --- | --- | --- | --- |
| Page title / metadata | `Project Management Dashboard` | `Workzen` | `app/layout.tsx` |
| Sidebar header | `Project Management Dashboard` | `Workzen` | `components/side-nav.tsx` |
| Sidebar "Dashboard" nav icon | `LayoutDashboard` icon | removed | `components/side-nav.tsx` |
| Sidebar structure | flat list | `Project` grouped as a collapsible section (Projects, Gantt Chart, Kanban); `Planner` renamed to `MyPlanner` | `components/side-nav.tsx` |
| Report export creator | `Project Management Dashboard` | `Workzen` | `app/api/reports/export/route.ts` |
| Package name | `project-management-dashboard` | `workzen` | `package.json` |
| Front/onboarding screen | immediate redirect to `/dashboard` | new screen showing the `Workzen` name and a "Get Started" button into the dashboard | `app/page.tsx` |
| Marketing footer | inline text | extracted into a reusable `MarketingFooter` component showing "By ViandraLabs" | `components/marketing-footer.tsx` |

## Notes / open items

- This app has no login/auth flow yet, so the onboarding screen sits before the dashboard rather than before a login page.
- The sidebar screenshot used as the redesign reference also showed a "Manage Users" nav item and a user avatar badge; these were intentionally left out since there is no user-management page in the app yet.
- `MarketingFooter` currently only renders on the onboarding screen (`app/page.tsx`). Reuse it on any future marketing/landing pages instead of duplicating the "By ViandraLabs" text.
