"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function ConditionalScripts() {
  const pathname = usePathname();
  const isRootPage = pathname === "/";

  return (
    <>
      {/* tracking for leads generation from visits rb2b - only on root page */}
      {isRootPage && (
        <Script id="reb2b-tracking">
          {`!function(key) {if (window.reb2b) return;window.reb2b = {loaded: true};var s = document.createElement("script");s.async = true;s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);}("9NMMZHR79ZNW");`}
        </Script>
      )}
      {/* midbound tracking */}
      <Script
        async
        src="https://p.midbound.click/dvCexi73dCQKzQmZwrBhbWFoqF4h2uV0"
        strategy="afterInteractive"
      />
    </>
  );
}
