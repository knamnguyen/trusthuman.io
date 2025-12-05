import "~/app/globals.css";

export const metadata = {
  title: "EngageKit Blog",
  description: "EngageKit Blog - Components and Tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
