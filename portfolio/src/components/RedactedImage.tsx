interface RedactedImageProps {
  caption?: string;
  aspectRatio?: string;
}

export default function RedactedImage({
  caption = "Internal work — details redacted",
  aspectRatio = "16/9"
}: RedactedImageProps) {
  return (
    <figure className="my-8">
      <div
        className="relative bg-neutral-100 overflow-hidden"
        style={{ aspectRatio }}
      >
        {/* Base pattern layer */}
        <div className="absolute inset-0 opacity-60">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="#d4d4d4"/>
                <rect x="4" y="4" width="4" height="4" fill="#d4d4d4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>

        {/* Simulated UI elements - blurred/pixelated */}
        <div className="absolute inset-0 p-6 flex flex-col gap-4">
          {/* Header bar */}
          <div className="h-8 bg-neutral-300/50 rounded blur-[2px] w-1/3"></div>

          {/* Main content area */}
          <div className="flex-1 flex gap-4">
            <div className="w-2/3 bg-neutral-200/40 rounded blur-[3px]"></div>
            <div className="w-1/3 flex flex-col gap-3">
              <div className="h-24 bg-neutral-300/30 rounded blur-[2px]"></div>
              <div className="h-16 bg-neutral-200/40 rounded blur-[2px]"></div>
              <div className="flex-1 bg-neutral-300/20 rounded blur-[3px]"></div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-10 bg-neutral-300/30 rounded blur-[2px] w-1/2"></div>
        </div>

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Diagonal redaction lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 6px)',
          }}
        />
      </div>
      <figcaption className="mt-3 text-xs text-[var(--muted)] italic">
        {caption}
      </figcaption>
    </figure>
  );
}
