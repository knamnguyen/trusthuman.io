import Link from "next/link";
import Image from "next/image";

import { MESSAGING } from "./landing-content";

export function Footer() {
  return (
    <footer className="bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-2">
            <Image
              src="/trusthuman-logo.svg"
              alt="TrustHuman"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-semibold">TrustHuman</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {MESSAGING.footer.tagline}
          </p>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {MESSAGING.footer.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-xs">
            {MESSAGING.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
