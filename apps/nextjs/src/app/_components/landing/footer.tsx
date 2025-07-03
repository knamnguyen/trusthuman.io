import Image from "next/image";

export const Footer = () => {
  return (
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
      </div>
    </footer>
  );
};
