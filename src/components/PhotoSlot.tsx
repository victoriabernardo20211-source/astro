import FleetScene, { type SceneName } from "./FleetScene";

interface PhotoSlotProps {
  /** Which built-in vector scene to show when no photo is provided. */
  scene: SceneName;
  /** Real photo URL — drop a file in /public and pass e.g. "/fleet/truck.jpg". */
  src?: string;
  /** Accessible description / fallback alt text. */
  label: string;
  /** Small caption chip rendered over the lower-left corner. */
  caption?: string;
  className?: string;
  radius?: number;
}

/**
 * Fleet imagery block. Renders a real photograph when `src` is set; otherwise
 * falls back to a branded vector scene so the layout always looks finished.
 */
export default function PhotoSlot({
  scene,
  src,
  label,
  caption,
  className = "",
  radius = 22,
}: PhotoSlotProps) {
  return (
    <div
      className={`relative overflow-hidden bg-brand ${className}`}
      style={{ borderRadius: radius }}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <FleetScene scene={scene} />
      )}

      {/* subtle readability gradient at the bottom */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

      {caption && (
        <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-[14px] py-[7px] text-[12.5px] font-bold text-brand shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
          <span className="h-2 w-2 rounded-full bg-brand-mid" />
          {caption}
        </span>
      )}
    </div>
  );
}
