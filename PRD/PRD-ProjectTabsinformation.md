# PRD — Project Detail Top Padding

## Summary

On the Project Detail page (`components/project-detail-client.tsx`), the top-most content of each card sits flush against the card's top edge — the `PMD-xxx` code + project name in the dark header card, and the label in each of the four info cards below it (Project Leader, PIC Project, Technical Lead, Health). This reads as cramped. Give each of these components more breathing room at the top without changing their horizontal padding or the spacing between cards.

## Problem

| Component | File / line | Current padding | Issue |
|---|---|---|---|
| Dark project header card (code, name, description, status pills) | `components/project-detail-client.tsx` line 75, `<CardContent className="space-y-4 p-6">` | uniform `p-6` on all sides | `PMD-xxx` code sits right at the card's top edge |
| Project Leader / PIC Project / Technical Lead / Health info cards | `components/project-detail-client.tsx` lines 108–111, `<CardContent className="p-4">` (×4) | uniform `p-4` on all sides | each card's label (e.g. "PROJECT LEADER") sits right at the card's top edge |

Both cases come from the shared `CardContent` component (`components/ui.tsx`), which applies `p-5 pt-0` by default — these two usages instead pass an explicit uniform padding (`p-6` / `p-4`) that overrides the default, removing the built-in top spacing without adding any back.

## Fix

Increase only the **top** padding on each of these `CardContent` usages, keeping the existing horizontal/bottom padding as-is:

- Dark header card: `p-6` → `p-6 pt-8`
- Each of the four info cards: `p-4` → `p-4 pt-6`

This mirrors the same fix already applied to `components/project-card.tsx` (`p-5` → `p-5 pt-7`, see `Documentation/projects-tab-ui-update.md`) — same problem (content flush against the card's top border), same style of fix (bump `pt-*` only, leave the rest of the padding untouched).

## Out of scope

- The "Schedule / Project timeline" card and the "Work Breakdown Structure" card further down the page already use the default `CardHeader` + `CardContent` combination (no explicit padding override), so they already have normal top spacing and don't need this fix.
- No change to card-to-card vertical spacing (`space-y-6` on the page wrapper) — this is purely about padding *inside* the two components listed above.
