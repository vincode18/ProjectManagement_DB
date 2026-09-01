# system_UIFormLogin2 — Full-Width Login Layout, Image Left at 50–70% Opacity

## Summary

Redesigns the `/login` page's layout from `PRD/Enhancement/enhancement-system_LoginFormAuth.md` §1 — that version was a centered, rounded, bordered card (`max-w-5xl`, `rounded-3xl`, `border`). This replaces it with a **full-bleed, full-width/full-height** split screen matching the reference: a faded background image filling the entire left half, the login form on the right, no card chrose, no border, edge to edge.

**Only the layout changes.** The form fields, validation, `POST /api/auth/login` call, session handling, "no Google button" rule, and the `LoginIllustration` animated-asset guidance are all unchanged from `enhancement-system_LoginFormAuth.md` §1–§3 — this document only replaces that document's page shell and swaps the small illustration for a full-panel background image.

| # | Requirement | Fix |
|---|---|---|
| 1 | Login spans the full width of the page | `app/(auth)/login/page.tsx`'s outer wrapper becomes `min-h-screen w-full` with no max-width/rounded/border card, `grid-cols-2` filling the whole viewport |
| 2 | Form on the right, image on the left | Left column: full-bleed background image panel. Right column: the form, vertically centered |
| 3 | Image at 50–70% opacity | The background image renders at `opacity-60` (a controllable value in the 50–70% band), with an accent-color tint layer underneath so the panel still reads as "on-brand" rather than just a faded photo |

---

## 1. Full-Width Page Shell

**Before** (`enhancement-system_LoginFormAuth.md` §1 — being replaced):

```tsx
<div className="flex min-h-screen items-center justify-center bg-bg px-6 py-10">
  <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-card lg:grid-cols-2">
    {/* ... */}
  </div>
</div>
```

**After** (`app/(auth)/login/page.tsx`):

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { LoginBackgroundPanel } from '@/components/login-background-panel';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <LoginBackgroundPanel />
      <div className="flex items-center justify-center bg-surface px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <h1 className="page-title">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to continue managing your projects.</p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account? <a href="/signup" className="font-semibold text-primary">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- `min-h-screen w-full` on the outer `grid` — no `max-w-*`, no `rounded-*`, no `border`, no `shadow-card`. The grid itself *is* the viewport, matching the reference's edge-to-edge split (compare against the reference image's panel, which has no visible page margin at all).
- `lg:grid-cols-2` keeps the same responsive behavior as before: on small screens the image panel collapses out (handled inside `LoginBackgroundPanel`, §2) and the form panel becomes the full page, which is the more usable mobile layout anyway.
- The form panel (`bg-surface`, centered content, `max-w-md`) is otherwise unchanged from `enhancement-system_LoginFormAuth.md` — `<LoginForm />` is the exact same component, no edits needed there.

---

## 2. Image Left, Form Right, at 50–70% Opacity

**New component** `components/login-background-panel.tsx` (replaces `LoginIllustration` as what renders in the left column — `LoginIllustration` itself doesn't need to change and can still be reused *inside* this panel if a small foreground illustration/logo is wanted on top of the faded background, per §2c):

```tsx
export function LoginBackgroundPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-sidebar lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/login-hero.gif"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white lg:p-14">
        <div>
          <p className="text-xl font-bold">Workzen</p>
          <p className="text-sm text-white/70">Project Management App</p>
        </div>
        <p className="text-xs text-white/50">By ViandraLabs</p>
      </div>
    </div>
  );
}
```

**a) Full-bleed image (Requirement 2):**
- `absolute inset-0 h-full w-full object-cover` makes the `<img>` fill its parent panel completely regardless of the image's native aspect ratio (`object-cover` crops rather than distorts) — this is what makes it read as a background rather than an inline illustration, matching the reference's photo filling its entire half of the screen.
- The parent `<div>` needs `relative overflow-hidden` so the absolutely-positioned image is clipped to the panel instead of overflowing the grid column.

**b) 50–70% opacity (Requirement 3):**
- `opacity-60` on the `<img>` itself is the direct implementation of "50–70% opacity" (Tailwind's `opacity-50` through `opacity-70` are all valid choices in that band — `opacity-60` is the midpoint, adjust to taste once the real asset is in place and legibility can be checked against it).
- `bg-sidebar` on the **parent** panel (not the image) is what shows through the faded image — since the app's sidebar/onboarding screens already use this navy (`Documentation/rebranding-workzen.md`, `app/page.tsx`), a 60%-opacity image over that background reads as "the brand color, subtly textured by the photo" rather than just a washed-out picture on white. This is the same visual effect as the reference's blue diagonal panel with a faint pattern behind it — a solid brand color as the base, the image knocked back on top of it.
- **Text stays legible without a separate overlay layer:** because the image sits *behind* the `relative z-10` text block (not on top of it) and is already at reduced opacity over a dark base color, the "Workzen" wordmark and "By ViandraLabs" text read clearly without needing an extra tint `<div>`. If the actual asset is busy/high-contrast enough to still interfere, add one more layer between the image and the text:

```tsx
<div className="absolute inset-0 bg-sidebar/50" /> {/* optional extra tint if the image needs more knock-back */}
```

**c) Where the small foreground illustration goes (optional, matches reference 2's floating app-preview card):**
If a smaller foreground graphic (like the reference's tilted "Example File" card, or this app's existing `LoginIllustration` person-at-laptop artwork) should still appear *on top of* the faded full-bleed background rather than being the background itself, nest it inside the text block:

```tsx
<div className="relative z-10 flex h-full flex-col justify-between p-10 text-white lg:p-14">
  <div>
    <p className="text-xl font-bold">Workzen</p>
    <p className="text-sm text-white/70">Project Management App</p>
  </div>
  <LoginIllustration /> {/* unchanged from enhancement-system_LoginFormAuth.md §3 */}
  <p className="text-xs text-white/50">By ViandraLabs</p>
</div>
```

This keeps `LoginIllustration` (and its animated-GIF/`unoptimized`/Lottie guidance from `enhancement-system_LoginFormAuth.md` §3) fully reusable — it just moves from being the *only* visual in the panel to sitting in front of the new faded full-bleed background.

## Out of Scope

- Swapping the background image per light/dark theme or per season/campaign — a single static (or animated) asset is assumed, same as `enhancement-system_LoginFormAuth.md` §3.
- Applying this same full-bleed treatment to `/signup` — not requested here, but `LoginBackgroundPanel` is a standalone component, so reusing it on the sign-up page (`app/(auth)/signup/page.tsx`) is a one-line addition if wanted later.
