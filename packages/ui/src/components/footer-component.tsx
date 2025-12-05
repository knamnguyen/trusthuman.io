"use client";

import React from "react";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { siX, siYoutube } from "simple-icons";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "Updates", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "#" },
      { label: "About", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export function FooterComponent() {
  return (
    <footer className="bg-background mt-20 border-t px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="container mx-auto max-w-7xl">
        {/* Main footer content */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 md:grid-cols-4 lg:grid-cols-6 lg:gap-8">
          {/* Logo and description section */}
          <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold sm:text-2xl">
                linkedin <span style={{ color: "#e5486c" }}>hero</span> blog
              </h2>
              <img
                src="https://engagekit-ghost-blog.vercel.app/media/engagekit-logo.svg"
                alt="EngageKit"
                className="h-16 w-auto sm:h-20"
                style={{
                  border: "none",
                }}
              />
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              AI-powered blog platform for creating engaging content and
              building your audience.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title} className="col-span-1 flex flex-col">
              <h3 className="text-foreground mb-3 text-sm font-semibold sm:mb-4">
                {column.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors sm:text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t pt-6 sm:pt-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-col sm:gap-4 md:flex-row">
            {/* Left side - Copyright and info */}
            <div className="text-muted-foreground flex flex-col gap-2 text-center text-xs sm:text-center sm:text-sm md:text-left">
              <p>Copyright © 2025 EngageKit Blog. All rights reserved.</p>
              <p className="text-xs">Made with ☕ around the world</p>
            </div>

            {/* Right side - Social icons */}
            <div className="flex items-center justify-center gap-3 sm:justify-center md:justify-end">
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                aria-label="Follow on X"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>{siX.title}</title>
                  <path d={siX.path} />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                aria-label="Follow on LinkedIn"
              >
                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                aria-label="Follow on YouTube"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>{siYoutube.title}</title>
                  <path d={siYoutube.path} />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
