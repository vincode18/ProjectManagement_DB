# Enhancement — Login Form with Side Panel + Admin-Validated Sign-Up

## Summary

This is the first document in this series to actually build the auth system every other Settings/Profile/Log-Management/Helpdesk doc has been depending on and stubbing out (`system_SettingsManagement.md` §0, `enhancement-system_MyProfile.md` §0, `enhancement-system_LogManagement.md`, `enhancement-system_HelpdeskDashboard.md` §3 all assume a `getCurrentUser()`/session helper that doesn't exist yet). This document builds it: real credential login, a two-panel login page matching the reference design, self-service sign-up that lands in a **pending** state, and Admin approval of new accounts from **Manage Users**.

| # | Requirement | Fix |
|---|---|---|
| 1 | Login page layout similar to the reference, keep the standard "Login" button | New `/login` route: illustration side panel + form panel, email/password + "Remember me" + a `Log In` button that posts credentials for real |
| 2 | Sign-up creates a pending account; Admin validates via Manage Users | `POST /api/auth/register` creates the user with `approvalStatus: pending`; login is blocked until an Admin approves them in Manage Users |
| 3 | No "Continue with Google" — standard login only | Google button omitted entirely from the form |
| 4 | Improve the UI using the attached illustration asset | A dedicated `LoginIllustration` component on the left panel |
| 5 | Support an *animated* image asset | `LoginIllustration` renders via a plain `<img>` (not `next/image`) so animated GIF/APNG/SVG assets keep animating, plus a documented Lottie option |

---

## 0. Auth Foundation (New — everything else in this app depends on this)

No auth exists today: `app/page.tsx`'s "Get Started" button links straight to `/dashboard`, and there is no session, no password field, no protected-route middleware. This section is the minimum needed to make `/login` real; later docs' `getCurrentUser()`/`requireAdmin()` stand-ins become real implementations of the helpers defined here.

**a) New dependencies:**

```bash
npm install bcryptjs jose
```

- `bcryptjs` — password hashing (pure JS, no native build step, fine for this app's scale).
- `jose` — signs/verifies the session cookie as a JWT; well-maintained, works in the Next.js Edge runtime (needed for `middleware.ts` in §5).

**b) Schema** — extends `User` with what login/registration/approval need (`username`/`passwordHash` were already anticipated in `PRD/Enhancement/enhancement-system_MyProfile.md` §0; this adds the approval workflow):

```prisma
enum ApprovalStatus {
  pending
  approved
  rejected
}

model User {
  // ...existing fields (name, email, role, ...)
  username       String         @unique
  passwordHash   String
  approvalStatus ApprovalStatus @default(pending)
}
```

- New self-registered users start `pending` — see §2.
- Seeded/admin-created users (e.g. via `PRD/Enhancement/system_SettingsManagement.md` §2's "+ Add User") should be created with `approvalStatus: 'approved'` directly — an admin creating an account *is* the approval.

**c) Password + session helpers** (`lib/auth.ts`, new file):

```ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'workzen_session';
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, rememberMe: boolean) {
  const expiresIn = rememberMe ? '30d' : '1d';
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
```

`SESSION_SECRET` is a new required env var (`.env.local` / deployment secrets) — a long random string, never committed.

**d) `getCurrentUser()` / `requireAdmin()` become real** (`lib/session.ts` — replaces the stand-ins referenced by every earlier doc):

```ts
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/auth';

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin' ? user : null;
}

export async function requireHelpdeskAccess() {
  const user = await getCurrentUser();
  if (!user || !['helpdesk_user', 'admin'].includes(user.role)) redirect('/dashboard');
  return user;
}
```

Every `// TODO: replace with real auth` note left in the earlier Settings/Profile/Log/Helpdesk documents resolves by pointing at this file — no changes needed on their side beyond removing the stand-in comment.

---

## 1. Login Page — Side Panel Layout

**Route** (`app/(auth)/login/page.tsx`, new file, new `(auth)` route group so it doesn't pick up the dashboard's sidebar layout):

```tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { LoginIllustration } from '@/components/login-illustration';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard'); // already logged in - don't show the login form again

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-card lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-sidebar p-10 text-white lg:flex">
          <div>
            <p className="text-xl font-bold">Workzen</p>
            <p className="text-sm text-white/60">Project Management App</p>
          </div>
          <LoginIllustration />
          <p className="text-xs text-white/40">By ViandraLabs</p>
        </div>
        <div className="p-8 sm:p-10">
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

- Matches the reference's two-panel shape (illustration left, form right) using the app's **actual** brand (`Workzen` / `bg-sidebar` navy / yellow `primary` button), not the reference's blue "ProjectFlow" palette — the reference is a layout guide, not a re-skin.
- The illustration panel `hidden ... lg:flex`s away on small screens, same responsive pattern the rest of the app already uses for the sidebar — the form stays usable full-width on mobile.
- A logged-in user hitting `/login` directly is redirected to `/dashboard` rather than shown the form again.

**Form (Requirement 1 + 3 — standard button, no Google)** (`components/login-form.tsx`, new file):

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from './ui';

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => null);
    setSubmitting(false);

    if (!response.ok) {
      setError(data?.error ?? 'Unable to log in');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="login-username" className="text-sm font-semibold text-ink">Username</label>
        <Input id="login-username" name="username" placeholder="e.g. alya" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-sm font-semibold text-ink">Password</label>
        <Input id="login-password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm((f) => ({ ...f, rememberMe: e.target.checked }))} />
        Remember me
      </label>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}
```

- **No "Continue with Google" button, no divider** — the form is exactly login-only, per requirement 3.
- Uses `username` (matches the reference's actual current screenshot, which already shows `Username`/`Password`, not `Email`/`Password`) — consistent with `enhancement-system_MyProfile.md` §0's `username` field on `User`.

**API** (`app/api/auth/login/route.ts`, new file):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  const { username, password, rememberMe } = await request.json();

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  if (user.approvalStatus !== 'approved') {
    return NextResponse.json(
      { error: user.approvalStatus === 'pending' ? 'Your account is awaiting admin approval.' : 'Your account was not approved.' },
      { status: 403 }
    );
  }

  await createSession(user.id, Boolean(rememberMe));
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  // logActivity({ userId: user.id, action: 'login', entityType: 'User', entityId: user.id }) - see enhancement-system_LogManagement.md §4

  return NextResponse.json({ ok: true });
}
```

- Deliberately returns the **same generic error** ("Invalid username or password") for a wrong username vs. a wrong password — don't leak which one was incorrect.
- A `pending`/`rejected` account gets a clear, distinct message instead of "invalid credentials" — the person knows to wait for approval rather than assuming they mistyped something.
- `lastLoginAt` write and the `login` audit-log call close the loop with `enhancement-system_LogManagement.md` §4, which specced exactly this but couldn't wire it up without real auth.

---

## 2. Sign-Up → Pending → Admin Approval

**Sign-up route** (`app/(auth)/signup/page.tsx` + `components/signup-form.tsx`, new files) — same side-panel shell as `/login`, form fields: Name, Username, Email, Password, Confirm Password.

**API** (`app/api/auth/register/route.ts`, new file):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { signupSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid signup payload' }, { status: 400 });
  }
  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, username, email, passwordHash, role: 'member', approvalStatus: 'pending' }
  });

  // No session is created here - a pending account cannot log in yet (see login route §1).
  return NextResponse.json({ ok: true, message: 'Account created. An admin will review your request.' }, { status: 201 });
}
```

```ts
// lib/validators.ts (addition)
export const signupSchema = z
  .object({
    name: z.string().min(1),
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
```

- New accounts default to `role: 'member'` — an admin can promote to `admin`/`helpdesk_user` later via Manage Users (`system_SettingsManagement.md` §2), separate from the approval decision itself.
- Registering does **not** log the user in — `approvalStatus: 'pending'` blocks login at `/api/auth/login` until approved, so there's no window where an unapproved account has an active session.

**Admin approval UI — extends Manage Users** (`components/user-management-client.tsx`, from `system_SettingsManagement.md` §2b): add a "Pending Approval" section above the regular user table, visible only when `isAdmin`:

```tsx
{isAdmin && pendingUsers.length > 0 ? (
  <Card>
    <CardContent className="space-y-3 p-5 pt-7">
      <h3 className="section-title">Pending Approval ({pendingUsers.length})</h3>
      {pendingUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-muted">{user.username} · {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => respondToApproval(user.id, 'approved')}>Approve</Button>
            <Button variant="ghost" onClick={() => respondToApproval(user.id, 'rejected')}>Reject</Button>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
) : null}
```

```ts
async function respondToApproval(userId: string, decision: 'approved' | 'rejected') {
  await fetch(`/api/users/${userId}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvalStatus: decision })
  });
  router.refresh();
}
```

**API** (`app/api/users/[id]/approval/route.ts`, new file):

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { id } = await params;
  const { approvalStatus } = await request.json();
  if (!['approved', 'rejected'].includes(approvalStatus)) {
    return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data: { approvalStatus } });
  return NextResponse.json(user);
}
```

- Admin-only (`requireAdmin()`), same boundary pattern as the create/delete user endpoints in `system_SettingsManagement.md` §2a.
- A rejected account stays in the database (auditable) rather than being deleted — an admin can reconsider later without the person re-registering.

---

## 3. The Illustration (Requirements 4 + 5)

**Fix** (`components/login-illustration.tsx`, new file):

```tsx
export function LoginIllustration() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/login-hero.gif"
        alt="Illustration of a person managing project tasks"
        className="max-h-72 w-auto"
      />
    </div>
  );
}
```

Why a plain `<img>` and not `next/image` (Requirement 5 — supporting an *animated* asset):

- Next.js's `<Image>` component runs every image through its optimizer, which **re-encodes GIFs as a static frame** unless the image is served `unoptimized` — an animated illustration would silently stop animating.
- A plain `<img src="/illustrations/login-hero.gif">` (asset dropped in `public/illustrations/`) plays the animation exactly as authored, with zero extra config. This works for any animated raster/vector format (GIF, APNG, animated SVG) without touching `next.config.js`.
- If `next/image` is preferred for its lazy-loading/layout-shift benefits, the equivalent is:

```tsx
import Image from 'next/image';

<Image src="/illustrations/login-hero.gif" alt="..." width={320} height={280} unoptimized />
```

  `unoptimized` is required specifically to preserve GIF animation — without it, Next.js still flattens it to a still frame.

- **If the actual asset is Lottie JSON** (a vector animation, not a raster GIF) rather than a GIF, swap the `<img>` for `lottie-react` instead:

```bash
npm install lottie-react
```

```tsx
'use client';
import Lottie from 'lottie-react';
import loginAnimation from '@/public/illustrations/login-hero.json';

export function LoginIllustration() {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <Lottie animationData={loginAnimation} loop className="max-h-72" />
    </div>
  );
}
```

  Pick whichever matches the actual asset format once it's finalized — both variants are drop-in replacements for the same `LoginIllustration` component, so nothing else in §1 needs to change either way.

---

## 4. Protecting the Dashboard (Middleware)

**Problem:** none of this matters if `/dashboard` and friends are still reachable without a session — today they are, since nothing checks.

**Fix** (`middleware.ts`, new file, project root):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const PUBLIC_PATHS = ['/', '/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('workzen_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|illustrations).*)']
};
```

- Runs in the Edge runtime, which is why §0 chose `jose` over a Node-only JWT library — `jsonwebtoken` would fail to load here.
- `PUBLIC_PATHS` keeps the existing onboarding screen (`/`) and the new `/login`/`/signup` reachable without a session; everything else (the whole `(dashboard)` route group, all `/api/*` except `/api/auth/*`) requires a valid session cookie.
- This only checks the cookie is a **validly signed, unexpired** token — it does not re-check `approvalStatus` on every request (that's enforced once, at login). If an approved user is later `rejected`, add a lightweight allow-list/deny-list check here as a fast-follow; not building that now to keep this middleware cheap (no DB round-trip per request).

**Integration change:** `app/page.tsx`'s "Get Started" button (§ current: `href="/dashboard"`) becomes `href="/login"` — since `/dashboard` is now behind auth, the onboarding screen should route to the login form, not straight to the app.
