# Enhancement — My Profile Page Layout

## Summary

There is no `/profile` route in the codebase today — `Development/app` has no `profile` directory, and `User` (`prisma/schema.prisma`) only has `name`, `email`, and `role`, with no `username`, no team relation, and no password field at all (there's no login/auth system yet, see the "Baseline" note below). This document specs a new Profile page matching the reference layout (Identity / Role & Team / Security), focused on three concrete layout requirements:

| # | Requirement | Fix |
|---|---|---|
| 1 | Top padding | Give each section card (`Identity`, `Role & Team`, `Security`) breathing room above its heading, same `pt-*` pattern used elsewhere in the app |
| 2 | Every field is clearly labeled with a placeholder | A shared `FormField` wrapper (visible `<label>` + `name` + `placeholder`) used for every input on the page, no bare inputs |
| 3 | Standardized field sizing | All text/password inputs share one `Input` component at a fixed height/width behavior, laid out on one consistent 2-column grid instead of a mix of inline label-value rows and boxed inputs |

---

## 0. Baseline — What This Depends On

- **No auth/session system.** The app has no login flow (see `PRD/Enhancement/system_SettingsManagement.md` §0, which flagged the same gap). "Your account" here means "the currently logged-in user," which doesn't exist yet — this spec assumes the same `getCurrentUser()` / `requireAdmin()`-style session helper introduced there. Until real auth lands, the Profile page can only meaningfully operate against a stand-in "acting as" user.
- **New `User` fields needed** — `username` and a password field are shown in the reference but don't exist on `User` today:

```prisma
model User {
  // ...existing fields
  username     String  @unique
  passwordHash String?
}
```

- **No `Team` model.** The reference shows a read-only "Teams" value ("Product Delivery"). Building a full team system is out of scope here — treat it as a simple read-only display field for now (see §3), sourced from a plain `team String?` column on `User` rather than a relation, until a real team model is specced separately.
- **Change Password** needs a real password-hash comparison (`bcrypt.compare` against `passwordHash`) once `passwordHash` exists — this can't be wired up for real until the auth baseline above lands, but the form/endpoint shape below is still worth building now.

---

## 1. Top Padding for Each Section

**Problem:** in the reference layout, "Your account" (Identity), "Managed by admins" (Role & Team), and "Change password" (Security) all sit with their `label`/heading flush against their card's top edge — the same "content flush against card top" issue already fixed on the Projects tab (`Documentation/projects-tab-ui-update.md`) and the Project Detail page (`PRD/PRD-ProjectTabsinformation.md`).

**Fix** (`app/(dashboard)/profile/page.tsx`): apply the same `pt-*` bump used in those two fixes to each section's `CardContent`:

```tsx
<Card>
  <CardContent className="space-y-4 p-6 pt-8">
    <div>
      <p className="label">Identity</p>
      <h2 className="section-title mt-1">Your account</h2>
    </div>
    {/* avatar + fields */}
  </CardContent>
</Card>
```

Apply `p-6 pt-8` to all three section cards (Identity, Role & Team, Security) — consistent padding across the whole page, not just the first section.

---

## 2. Every Field Clearly Labeled, With a Placeholder

**Problem:** the reference mixes two field styles — proper boxed inputs with a bold label above them (Name, Current password, New password), and plain inline "Label" + faint value text with no visible input chrome at all (Username, Email, Role, Teams, Confirm new password). This is inconsistent and, per the earlier `PRD-ProjectFormsUpdate.md` finding, the app's inputs have historically been missing `name` attributes and placeholders too.

**Fix — a shared `FormField` wrapper** (`components/form-field.tsx`, new file) used for every field on the page, so labeling is uniform by construction:

```tsx
import type { ReactNode } from 'react';

export function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}
```

**Usage on the Profile page** — every field gets a visible label *and* a placeholder (belt-and-suspenders: the label always shows, the placeholder gives an example/hint even though the label already names the field):

```tsx
<FormField label="Name" htmlFor="profile-name">
  <Input id="profile-name" name="name" placeholder="Your full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
</FormField>

<FormField label="Username" htmlFor="profile-username">
  <Input id="profile-username" name="username" placeholder="e.g. vian" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
</FormField>

<FormField label="Email" htmlFor="profile-email">
  <Input id="profile-email" name="email" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
</FormField>

<FormField label="Role" htmlFor="profile-role">
  <Input id="profile-role" name="role" value={role} disabled placeholder="Role" />
</FormField>

<FormField label="Teams" htmlFor="profile-team">
  <Input id="profile-team" name="team" value={team ?? ''} disabled placeholder="No team assigned" />
</FormField>

<FormField label="Current password" htmlFor="profile-current-password">
  <Input id="profile-current-password" name="currentPassword" type="password" placeholder="Enter current password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
</FormField>

<FormField label="New password" htmlFor="profile-new-password">
  <Input id="profile-new-password" name="newPassword" type="password" placeholder="At least 8 characters" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
</FormField>

<FormField label="Confirm new password" htmlFor="profile-confirm-password">
  <Input id="profile-confirm-password" name="confirmPassword" type="password" placeholder="Re-enter new password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
</FormField>
```

- `Role` and `Teams` are rendered as **disabled** inputs (not plain text) so they still go through the same `FormField` + `Input` treatment as every other field — visually consistent, while still communicating "you can't edit this" via the disabled state and the "Managed by admins" subtitle already in the reference.
- Every field now has a `name`, an `id`/`htmlFor` pairing (label click focuses the input — an accessibility fix the app didn't have before), and a placeholder, closing the same gap `PRD-ProjectFormsUpdate.md` §2 already flagged on the Project form.

---

## 3. Standardized Field Sizing

**Problem:** in the reference, "Name" renders as a full-width boxed input, but "Username"/"Email"/"Teams" render as plain inline text with no box at all (so they have no comparable "size"), and the two password columns end up different widths because the right column's box heights don't line up with the left column's. There's no single sizing rule being followed.

**Fix:**
- Every field on the page uses the same `Input` component (`components/ui.tsx`) at its default size (`.input` — `w-full`, fixed `px-3 py-2` — see `app/globals.css`) with no per-field width/height overrides. Since `Role` and `Teams` now also render as (disabled) `Input`s per §2, they automatically match every other field's size instead of being unboxed text.
- Lay out every section on **one consistent 2-column grid**, the same `grid gap-4 md:grid-cols-2` pattern already used in `components/project-form.tsx`, rather than the reference's mix of full-width rows and an oddly-proportioned second column:

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <FormField label="Name" htmlFor="profile-name">...</FormField>
  <FormField label="Username" htmlFor="profile-username">...</FormField>
  <FormField label="Email" htmlFor="profile-email">...</FormField>
  <FormField label="Role" htmlFor="profile-role">...</FormField>
</div>
```

- Buttons follow the same rule: `Upload photo` (secondary), `Save profile` (primary), and `Update password` (primary) all use the existing `Button` component with no custom sizing — so they sit at the same height as each other and as the `Input`s beside them, the same "shared control height" principle used for the Kanban toolbar (`PRD/Enhancement/system_KanbanSearch.md` §3).
- Avatar circle stays a fixed `h-16 w-16` regardless of name length (initials-based, same pattern as the sidebar's user avatar), so it never stretches the row it sits in.

---

## Page Structure Reference

```tsx
// app/(dashboard)/profile/page.tsx (new file)
import { PageHeader } from '@/components/page-header';
import { ProfileForm } from '@/components/profile-form';
import { getCurrentUser } from '@/lib/session';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="View and update your own account details." />
      <ProfileForm user={user} />
    </div>
  );
}
```

`components/profile-form.tsx` (client component) owns the three `Card`s (Identity, Role & Team, Security) described in §1–§3, each `PATCH`-ing a distinct endpoint (`/api/profile`, `/api/profile/password`) so a validation error on the password form doesn't clobber unsaved edits to the name/username/email form, matching the reference's separate "Save profile" and "Update password" actions.
