import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">TrustHuman</h1>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Dashboard
              </Link>
              <UserButton />
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Prove You're Human
        </h2>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
          TrustHuman verifies social engagement with face detection. Build your
          public profile of verified human activity across LinkedIn and X.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-lg font-medium">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-lg font-medium"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border p-6 text-left">
            <h3 className="text-lg font-semibold">Face Verification</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Capture a photo when you engage to prove a real human is behind
              the keyboard.
            </p>
          </div>
          <div className="rounded-lg border p-6 text-left">
            <h3 className="text-lg font-semibold">Public Profile</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Share your trusthuman.io/username profile to showcase your
              verified engagement.
            </p>
          </div>
          <div className="rounded-lg border p-6 text-left">
            <h3 className="text-lg font-semibold">Streak & Stats</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Build your streak and track your verified human activity across
              platforms.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} TrustHuman. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
