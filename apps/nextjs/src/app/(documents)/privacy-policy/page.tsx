import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@sassy/ui/card";
import { Separator } from "@sassy/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy | TrustHuman",
  description:
    "Privacy Policy for TrustHuman Chrome Extension - Learn how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-card text-foreground min-h-screen">
      {/* Header */}
      <header className="bg-card/90 sticky top-0 z-50 w-full border-b backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/trusthuman-logo.svg"
              alt="TrustHuman Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold tracking-tight">TrustHuman</h1>
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border shadow-lg">
          <CardContent className="p-8 md:p-12">
            {/* Title Section */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-lg">for TrustHuman</p>
              <p className="bg-primary/10 text-primary mt-4 inline-block rounded-full px-4 py-1 text-sm font-medium">
                Effective Date: February 24, 2026
              </p>
            </div>

            <Separator className="my-8" />

            {/* Introduction */}
            <p className="text-muted-foreground mb-8">
              This Privacy Policy describes our policies and procedures on the
              collection, use, and disclosure of your information when you use
              the TrustHuman Chrome Extension and website (the &quot;Service&quot;).
            </p>
            <p className="text-muted-foreground mb-8">
              By using our Service, you agree to the collection and use of
              your information in accordance with this policy.
            </p>

            <Separator className="my-8" />

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground mb-6">
                To provide and improve our Service, we collect the following
                types of information:
              </p>

              <div className="space-y-6">
                <div className="bg-muted/30 rounded-lg border p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.1. Account Information
                  </h3>
                  <p className="text-muted-foreground">
                    When you register and sign in to TrustHuman, we use Clerk
                    (clerk.com) for authentication. Through Clerk, we collect
                    and manage your basic profile information, such as your User
                    ID, email address, and username. This is essential for creating
                    your account and providing the Service.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg border p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.2. Selfie Photos for Verification
                  </h3>
                  <p className="text-muted-foreground">
                    The core function of TrustHuman is to verify that you are a
                    real human. When you verify a comment, you take a quick selfie
                    which is sent to our server for face detection using AWS
                    Rekognition. <strong>Your photo is deleted immediately after
                    verification</strong> - typically within seconds. We do NOT
                    store photos, perform facial recognition, or retain any
                    biometric data.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg border p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.3. Comment Metadata
                  </h3>
                  <p className="text-muted-foreground">
                    When you verify a comment, we store metadata about the
                    verification: the platform (LinkedIn, X, or Facebook), the
                    timestamp, the post author&apos;s public name and avatar URL,
                    and a snippet of the original post. We do NOT store the full
                    content of your comments or the posts you engage with.
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg border p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    1.4. Usage Statistics
                  </h3>
                  <p className="text-muted-foreground">
                    We track your verification count, current streak, and longest
                    streak. This information is displayed on your public profile
                    and used for the leaderboard.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-6">
                Your information is used for the following purposes:
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="bg-primary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      To Provide the Verification Service:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      Your selfie photo is used solely to confirm you are a human
                      (not a bot) through face detection. The photo is deleted
                      immediately after this check.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      To Display Your Public Profile:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      Your username, Human #, verification stats, and activity
                      history are displayed on your public profile at
                      trusthuman.io/username.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      To Power the Leaderboard:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      Your verification count and streak contribute to your
                      ranking on the public leaderboard.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">For Communication:</span>{" "}
                    <span className="text-muted-foreground">
                      We may use your email address to send you important
                      updates about the Service, welcome emails, or occasional
                      newsletters. You can opt-out of marketing communications
                      at any time.
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
              <p className="text-muted-foreground mb-6">
                We do not sell your personal information. We share information
                with the following third-party services to provide our core
                functionality:
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="bg-muted-foreground mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      Authentication Provider (Clerk):
                    </span>{" "}
                    <span className="text-muted-foreground">
                      All user authentication and account management are handled
                      by Clerk. Your account data is subject to Clerk&apos;s
                      Privacy Policy.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-muted-foreground mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      Face Detection (AWS Rekognition):
                    </span>{" "}
                    <span className="text-muted-foreground">
                      Your selfie photo is sent to AWS Rekognition for face
                      detection. AWS processes the image to determine if a human
                      face is present, then we delete the image. AWS does not
                      store your photos.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-muted-foreground mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">
                      Email Service (Loops):
                    </span>{" "}
                    <span className="text-muted-foreground">
                      We use Loops for welcome emails and occasional newsletters.
                      Your email address may be shared with Loops for this purpose.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-muted-foreground mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div>
                    <span className="font-semibold">Legal Requirements:</span>{" "}
                    <span className="text-muted-foreground">
                      We may disclose your information if required to do so by
                      law or in response to valid requests by public authorities.
                    </span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 4 - Photo Privacy */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                4. Photo Privacy (Important)
              </h2>
              <div className="border-primary/30 bg-primary/5 rounded-lg border-2 p-6">
                <p className="text-muted-foreground mb-4">
                  We take your photo privacy extremely seriously:
                </p>
                <ul className="text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>Photos are <strong>deleted immediately</strong> after face detection (within seconds)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>We <strong>never store</strong> your photos on our servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>We do <strong>not perform facial recognition</strong> or identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>We do <strong>not store biometric data</strong> or facial features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>The only question we ask: &quot;Is there a human face in this photo?&quot;</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">5. Data Security</h2>
              <p className="text-muted-foreground">
                We are committed to protecting your information. We use
                industry-standard security measures including HTTPS encryption,
                secure authentication via Clerk, and secure cloud infrastructure.
                However, no method of transmission over the internet is 100%
                secure. While we strive to use commercially acceptable means to
                protect your data, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the following rights regarding your data:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Access:</strong> You can view your data on your profile page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Deletion:</strong> You can request deletion of your account and all associated data by contacting us</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Opt-out:</strong> You can opt-out of marketing emails at any time</span>
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">
                7. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Effective Date&quot; at the top
                of this policy. You are advised to review this Privacy Policy
                periodically for any changes.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">8. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
              </p>
              <a
                href="mailto:knamnguyen.work@gmail.com"
                className="bg-primary/10 text-primary hover:bg-primary/20 inline-block rounded-lg border px-4 py-2 font-medium transition-all"
              >
                knamnguyen.work@gmail.com
              </a>
            </section>

            <Separator className="my-8" />

            {/* Agreement Statement */}
            <div className="bg-primary/5 rounded-lg border p-6 text-center">
              <p className="text-muted-foreground">
                By using the TrustHuman Chrome Extension and website, you
                signify your acceptance of this Privacy Policy. If you do not
                agree to this policy, please do not use our Service.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8 text-center">
              <p className="font-semibold">Ky-Nam Nguyen</p>
              <p className="text-muted-foreground text-sm">Creator of TrustHuman</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-card py-8">
        <div className="text-muted-foreground container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm">
          <Image
            src="/trusthuman-logo.svg"
            alt="TrustHuman Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <p>&copy; 2026 TrustHuman. Proving humanity in the age of AI.</p>
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
