export const VideoSection = () => {
  return (
    <section className="bg-zinc-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Yes, it works. <br />
              Here's how in 1 minute
            </h2>
            <h2 className="pt-2 text-xl font-bold tracking-tight sm:text-2xl">
              All it takes is a couple clicks to comment on 100 posts/day
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Completely organic and natural, undetectable by LinkedIn.
            </p>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-2xl border-4 border-black bg-black shadow-[8px_8px_0px_#000]">
            <div className="flex h-full items-center justify-center bg-zinc-800">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/k_SkDlggN1s?si=pPOxmu_Ov-9gQOJK"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
                quality="high"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
