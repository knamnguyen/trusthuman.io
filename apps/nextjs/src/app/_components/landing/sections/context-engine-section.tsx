import { MESSAGING } from "../landing-content";
import { PersonaCard } from "../cards/persona-card";

export function ContextEngineSection() {
  return (
    <section id="context-engine" className="bg-card py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {MESSAGING.contextEngine.headline}
          </h2>
          <p className="text-xl text-muted-foreground">
            {MESSAGING.contextEngine.subheadline}
          </p>
        </div>

        {/* YouTube Embed - Full Width */}
        <div className="mb-16">
          {/* Neo-brutalism card wrapper */}
          <div className="w-full max-w-4xl mx-auto rounded-xl bg-[#fbf6e5] p-3 border-[1.5px] border-black shadow-[4px_4px_0_#000]">
            <div className="aspect-video w-full overflow-hidden rounded-lg border-[1.5px] border-black">
              <iframe
                width="100%"
                height="100%"
                src={MESSAGING.contextEngine.youtubeUrl}
                title="EngageKit Context Engine Overview"
                style={{ border: "0px" }}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Persona Examples Grid */}
        <div className="max-w-5xl mx-auto">
          <p className="text-lg text-foreground leading-relaxed text-center mb-8">
            {MESSAGING.contextEngine.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MESSAGING.contextEngine.personas.map((persona) => (
              <PersonaCard key={persona.title} {...persona} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
