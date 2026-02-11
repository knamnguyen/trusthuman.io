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
    <div className="flex flex-wrap items-center">
      {isOdd ? (
        <>
          {/* Text on left (5/12), video on right (7/12) */}
          <div className="w-full pr-6 md:w-5/12 space-y-4">
            <Badge
              variant="secondary"
              className="border-2 border-border bg-primary text-primary-foreground px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-3xl font-bold text-foreground">{title}</h3>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="w-full px-4 md:w-7/12 md:px-0 md:pt-0 md:pl-32">
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-label={`Demo video showing ${title}`}
              className="m-auto rounded-lg border shadow-xl md:max-h-[400px] md:object-cover md:object-left md:[transform:scale(1.5)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </>
      ) : (
        <>
          {/* Video on left (7/12), text on right (5/12) */}
          <div className="w-full px-4 md:w-7/12 md:px-0 md:pt-0 md:pr-32 order-2 md:order-1">
            <video
              autoPlay
              loop
              muted
              playsInline
              aria-label={`Demo video showing ${title}`}
              className="m-auto rounded-lg border shadow-xl md:max-h-[400px] md:object-cover md:object-right md:[transform:scale(1.5)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]"
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="w-full pl-6 md:w-5/12 space-y-4 order-1 md:order-2">
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
