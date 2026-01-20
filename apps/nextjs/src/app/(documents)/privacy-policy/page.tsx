import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@sassy/ui/card";
import { Separator } from "@sassy/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy | EngageKit",
  description:
    "Privacy Policy for EngageKit Chrome Extension - Learn how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-zinc-50/90 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/engagekit-logo.svg"
              alt="EngageKit Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold tracking-tight">EngageKit</h1>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-black"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-2 border-black shadow-[8px_8px_0px_#000]">
          <CardContent className="p-8 md:p-12">
            {/* Title Section */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Privacy Policy
              </h1>
              <p className="text-lg text-zinc-600">for EngageKit</p>
              <p className="mt-4 inline-block rounded-full bg-pink-100 px-4 py-1 text-sm font-medium text-pink-700">
                Effective Date: July 6, 2025
              </p>
            </div>

            <Separator className="my-8 bg-zinc-200" />

            {/* Introduction */}
            <p className="mb-8 text-zinc-700">
              This Privacy Policy describes our policies and procedures on the
              collection, use, and disclosure of your information when you use
              the EngageKit Chrome Extension (the &quot;Service&quot; or
              &quot;Extension&quot;).
            </p>
            <p className="mb-8 text-zinc-700">
              By using our Extension, you agree to the collection and use of
              your information in accordance with this policy.
            </p>

            <Separator className="my-8 bg-zinc-200" />

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                1. Information We Collect
              </h2>
              <p className="mb-6 text-zinc-700">
                To provide and improve our Service, we collect the following
                types of information:
              </p>

              <div className="space-y-6">
                <div className="rounded-lg border-2 border-zinc-200 bg-zinc-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.1. Account Information
                  </h3>
                  <p className="text-zinc-700">
                    When you register and sign in to EngageKit, we use Clerk
                    (clerk.com) for authentication. Through Clerk, we collect
                    and manage your basic profile information, such as your User
                    ID and email address. This is essential for creating your
                    account, managing your subscription, and securing our
                    Service.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-zinc-200 bg-zinc-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.2. Social Media Content for AI Processing
                  </h3>
                  <p className="text-zinc-700">
                    The core function of EngageKit is to generate AI-powered
                    comments. To do this, when you activate the Extension on a
                    social media post (e.g., a LinkedIn post), the text content
                    of that specific post is collected and sent to a third-party
                    AI service provider (e.g., Google Gemini or OpenAI) for
                    processing. This content is used solely to generate a
                    relevant comment and is not stored on our servers after the
                    process is complete.
                  </p>
                </div>

                <div className="rounded-lg border-2 border-zinc-200 bg-zinc-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.3. Anonymized Usage Data
                  </h3>
                  <p className="text-zinc-700">
                    We may collect anonymous data about how you interact with
                    our Extension, such as feature usage frequency and
                    performance metrics. This information helps us identify
                    issues, improve the user experience, and understand user
                    preferences. This data is not linked to your personal
                    identity.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                2. How We Use Your Information
              </h2>
              <p className="mb-6 text-zinc-700">
                Your information is used for the following purposes:
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
                  <div>
                    <span className="font-semibold">
                      To Provide and Maintain our Service:
                    </span>{" "}
                    <span className="text-zinc-700">
                      Your account information is used to authenticate you and
                      give you access to the Extension&apos;s features. The
                      content of social media posts is used to provide the core
                      comment generation service.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
                  <div>
                    <span className="font-semibold">
                      To Manage Your Account:
                    </span>{" "}
                    <span className="text-zinc-700">
                      We use your information to manage your subscription status
                      and provide access to the appropriate features (Free or
                      Premium).
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
                  <div>
                    <span className="font-semibold">For Communication:</span>{" "}
                    <span className="text-zinc-700">
                      We may use your email address to send you important
                      updates about the Extension, security notifications,
                      newsletters, or marketing materials. You can opt-out of
                      marketing communications at any time.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500" />
                  <div>
                    <span className="font-semibold">
                      For Service Improvement:
                    </span>{" "}
                    <span className="text-zinc-700">
                      Anonymized usage data is analyzed to improve the
                      functionality, security, and usability of the Extension.
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                3. Data Sharing and Disclosure
              </h2>
              <p className="mb-6 text-zinc-700">
                We do not sell your personal information. However, we share
                information with the following third-party services to provide
                our core functionality:
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <span className="font-semibold">
                      Authentication Provider (Clerk):
                    </span>{" "}
                    <span className="text-zinc-700">
                      All user authentication and account management are handled
                      by Clerk. Your account data is subject to Clerk&apos;s
                      Privacy Policy.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <span className="font-semibold">AI Service Providers:</span>{" "}
                    <span className="text-zinc-700">
                      To generate comments, the text of the target social media
                      post is sent to third-party AI service providers. This
                      data is processed according to their respective privacy
                      policies.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-zinc-400" />
                  <div>
                    <span className="font-semibold">Legal Requirements:</span>{" "}
                    <span className="text-zinc-700">
                      We may disclose your information if required to do so by
                      law or in response to valid requests by public authorities
                      (e.g., a court, law enforcement, or government agency).
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">4. Data Security</h2>
              <p className="text-zinc-700">
                We are committed to protecting your information. We rely on the
                security measures of our trusted third-party provider, Clerk,
                for authentication and account security. However, no method of
                transmission over the internet or method of electronic storage
                is 100% secure. While we strive to use commercially acceptable
                means to protect your data, we cannot guarantee its absolute
                security.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                5. Changes to This Privacy Policy
              </h2>
              <p className="text-zinc-700">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Effective Date&quot; at the top
                of this policy. You are advised to review this Privacy Policy
                periodically for any changes.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">6. Contact Us</h2>
              <p className="mb-4 text-zinc-700">
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
              </p>
              <a
                href="mailto:knamnguyen.work@gmail.com"
                className="inline-block rounded-lg border-2 border-black bg-pink-100 px-4 py-2 font-medium text-pink-700 transition-all hover:bg-pink-200"
              >
                knamnguyen.work@gmail.com
              </a>
            </section>

            <Separator className="my-8 bg-zinc-200" />

            {/* Agreement Statement */}
            <div className="rounded-lg border-2 border-pink-200 bg-pink-50 p-6 text-center">
              <p className="text-zinc-700">
                By using the EngageKit Chrome Extension, you signify your
                acceptance of this Privacy Policy. If you do not agree to this
                policy, please do not use our Extension.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8 text-center">
              <p className="font-semibold text-zinc-800">Ky-Nam Nguyen</p>
              <p className="text-sm text-zinc-500">Creator of EngageKit</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-50 py-8">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm text-zinc-500">
          <Image
            src="/engagekit-logo.svg"
            alt="EngageKit Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <p>© 2025 EngageKit. Built for creators.</p>
          <Link href="/" className="text-pink-600 hover:text-pink-700">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
