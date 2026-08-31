# PRD — Project Form Update

## Summary

Fixes and additions for the "Create Project" / "Edit Project" popup (`components/project-form.tsx`, rendered inside `components/new-project-modal.tsx`) and the project card (`components/project-card.tsx`):

| # | Problem | Fix |
|---|---|---|
| 1 | The **Progress** field renders as a native number input with up/down spinner arrows, always starting at a visible `0` | Remove the spinner control from the create form |
| 2 | None of the fields have a `name` attribute, and most have no placeholder text (the dropdowns and date pickers show nothing until a value is picked) | Add a `name` to every field, and a placeholder to every field |
| 3 | There is no way to attach an external ITIS reference to a project | Add **ITIS Number** and **ITIS Link** fields to the form, and a button on the project card that opens the ITIS Link |

---

## 1. Remove the Progress "Ticker" (Spinner)

**Problem:** in `components/project-form.tsx` line 115, Progress is rendered as:

```tsx
<Input type="number" min="0" max="100" value={form.progress} onChange={...} />
```

Because `Input` (`components/ui.tsx`) forwards straight to a native `<input>`, `type="number"` renders the browser's default spinner (the up/down "ticker" arrows), and the field always shows `0` on a new project — there's nothing meaningful for the user to type here on creation.

**Fix:**
- On **create**, drop the Progress field from the visible form entirely. A new project has no tasks yet, so progress starts at `0` — the form already defaults `form.progress` to `0` and sends it in the payload, so this is a UI-only removal (no payload/API change needed).
- On **edit** (if Progress needs to stay editable there), keep the field but suppress the native spinner, e.g. `className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"`, or replace it with a plain text-style numeric input.
- This aligns with `PRD/Enhancement/enhancement-02.md` #4, where project completion is being driven by task counts rather than a manually typed percentage — long-term, Progress may not need manual entry at all.

---

## 2. Add `name` and Placeholder to Every Field

**Problem:** in `components/project-form.tsx`, only 3 of the 10 fields have a `placeholder` (Project code, Project name, Description), and **none** have a `name` attribute. The 5 `Select` dropdowns (Manager, Owner, Technical Lead, Status, Priority) and the 2 date inputs (Start, End) render with no placeholder/hint text — a user has to guess what each blank field is for before picking a value, and the missing `name` attributes make the fields unusable with native form APIs (`FormData`, browser autofill, accessibility tooling).

**Fix — add `name` + placeholder to every field:**

| Field | `name` | Placeholder / empty-state label |
|---|---|---|
| Project code | `code` | `Project code` *(already has this placeholder)* |
| Project name | `name` | `Project name` *(already has this placeholder)* |
| Description | `description` | `Description` *(already has this placeholder)* |
| Manager | `managerId` | first `<option>` reads `Select manager` |
| Owner | `ownerId` | first `<option>` reads `Select owner` |
| Technical Lead | `techLeadId` | keep existing `No technical lead` as the empty option |
| Status | `status` | first `<option>` reads `Select status` (until a default is explicitly chosen) |
| Priority | `priority` | first `<option>` reads `Select priority` |
| Start | `startDate` | `Start date` (via the input's `placeholder` attribute, and/or a `title`) |
| End | `endDate` | `End date` |
| Progress *(edit mode only, see #1)* | `progress` | `Progress %` |

**Notes:**
- Native `<select>` elements don't support a true placeholder the way text inputs do — the standard approach is a disabled, pre-selected first `<option value="">Select …</option>`. Since `managerId`/`ownerId` currently default to `users[0]`/`users[1]` (always pre-filled), adding a placeholder option only changes the *empty* state — no behavior change for the common case where users already exist.
- `<input type="date">` placeholder text is inconsistently honored by browsers, so pair the `placeholder` attribute with a `title`/`aria-label` of the same text to guarantee the hint is available.
- Applying `name` consistently also makes the form directly compatible with the browser's native validation/autofill and improves accessibility (label association via `aria-label` where a visible `<label>` isn't part of this design).
- This same field-labeling gap likely exists on `components/task-form.tsx` too (see `PRD/Enhancement/enhancement-02.md` #3, which is already simplifying that form) — worth applying the same `name` + placeholder treatment there once that enhancement lands, but it is out of scope for this document.

---

## 3. Add ITIS Number + ITIS Link Fields, with a Link Button on the Project Card

**Problem:** there is currently no field on `Project` for an external ITIS reference (`prisma/schema.prisma`'s `Project` model, `lib/types.ts`'s `Project` interface, and `lib/validators.ts`'s `projectSchema` have no such field), so there's no way to associate a project with its ITIS record, nor a way to jump to it from the project card (`components/project-card.tsx`).

**Fix:**

**a) Data model** — add two optional fields to `Project`:

```prisma
model Project {
  // ...existing fields
  itisNumber String?
  itisLink   String?
}
```

- Both optional (`String?`) — not every project has an ITIS reference.
- `itisLink` is a plain URL string; validate it as a URL at the form/schema level (see below) rather than at the database level.

**b) Validation** (`lib/validators.ts`, `projectSchema`):

```ts
itisNumber: z.string().optional().nullable(),
itisLink: z.string().url().optional().nullable().or(z.literal(''))
```

**c) Form fields** (`components/project-form.tsx`) — add two new inputs, following the same `name` + placeholder convention from section 2:

| Field | `name` | Placeholder |
|---|---|---|
| ITIS Number | `itisNumber` | `ITIS number` |
| ITIS Link | `itisLink` | `https://itis.example.com/record/...` |

Both are plain text inputs (`type="text"` / `type="url"` for the link), placed alongside the existing fields in the same two-column grid.

**d) Project card button** (`components/project-card.tsx`) — when `project.itisLink` is set, render a button/link that opens it:

```tsx
{project.itisLink ? (
  <a
    href={project.itisLink}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(event) => event.stopPropagation()}
    className="btn-secondary"
  >
    View ITIS
  </a>
) : null}
```

- `event.stopPropagation()` is required because `ProjectCard` is already wrapped in a `<Link href={/projects/${project.id}}>` (see `components/project-card.tsx` line 9) — without it, clicking the ITIS button would also navigate to the project detail page.
- `target="_blank"` + `rel="noopener noreferrer"` opens the ITIS record in a new tab without exposing `window.opener` to the external site.
- Hide the button entirely when `itisLink` is empty, rather than showing a disabled button.
- Same button can be reused on the project detail page (`components/project-detail-client.tsx`) next to the other project actions, showing `itisNumber` as its label/tooltip if present (e.g. `View ITIS · <itisNumber>`).
