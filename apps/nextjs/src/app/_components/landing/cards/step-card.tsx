import { Badge } from "@sassy/ui/badge";

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  videoPath: string;
}

export function StepCard({ number, title, description, videoPath }: StepCardProps) {
  const isOdd = number % 2 === 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      {isOdd ? (
        <>
          {/* Text on left, video on right */}
          <div className="space-y-4">
            <Badge
              variant="secondary"
              className="border-2 border-border bg-primary text-primary-foreground px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-3xl font-bold text-foreground">{title}</h3>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="relative w-full overflow-visible flex justify-center items-center md:min-h-[280px]">
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-label={`Demo video showing ${title}`}
              className="w-full rounded-lg border shadow-xl md:max-h-[280px] md:object-cover md:object-left md:[transform:scale(1.05)_perspective(1000px)_rotateY(-6deg)_rotateX(1deg)]"
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </>
      ) : (
        <>
          {/* Video on left, text on right */}
          <div className="relative w-full overflow-visible flex justify-center items-center md:min-h-[280px] md:order-1 order-2">
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-label={`Demo video showing ${title}`}
              className="w-full rounded-lg border shadow-xl md:max-h-[280px] md:object-cover md:object-right md:[transform:scale(1.05)_perspective(1000px)_rotateY(6deg)_rotateX(1deg)]"
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="space-y-4 md:order-2 order-1">
            <Badge
              variant="secondary"
              className="border-2 border-border bg-primary text-primary-foreground px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-3xl font-bold text-foreground">{title}</h3>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
        </>
      )}
    </div>
  );
}
