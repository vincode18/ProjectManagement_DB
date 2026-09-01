# Projects Tab UI Update

## Summary

UI/UX pass on the `Projects` tab (`app/(dashboard)/projects/page.tsx`): fixed card spacing, restyled the header actions, and added project search.

## What changed

| Area | Before | After | File |
| --- | --- | --- | --- |
| Project card top padding | `p-5` on all sides — the `PMD-xxx` code sat flush against the card's top edge | `p-5 pt-7` — extra top padding so the code/title isn't cramped against the border | `components/project-card.tsx` |
| "New Project" button | outlined/secondary button, text only | filled primary button with a `Plus` icon, to read as the primary action | `components/new-project-modal.tsx` |
| "Refresh" button | outlined button with a "Refresh" text label | icon-only button (`RefreshCw` icon, no label) on the Projects tab via a new `iconOnly` prop; the Dashboard tab keeps the labeled version | `components/refresh-button.tsx` |
| Search | none | a search bar (with a `Search` icon) below the page header, filtering by project name or code via the existing `search` query param and `getProjectsFiltered` | `app/(dashboard)/projects/page.tsx` |

## How search works

The search input is a plain GET `<form>` (no client JS) that submits `?search=...` back to `/projects`. The page reads `searchParams.search` and passes it straight into `getProjectsFiltered({ search })`, which already supported filtering projects by name/code (case-insensitive) on the Prisma query — this reuses that existing filter rather than adding a new one. This mirrors the same GET-form pattern already used on the Calendar tab.

## Notes / open items

- `RefreshButton`'s `iconOnly` prop defaults to `false`, so the Dashboard tab's "Refresh" button is unaffected by this change.
- Search currently only matches project name/code, same scope as the existing Calendar search. Status/priority filter chips (like Calendar has) were not added here since they weren't requested.
