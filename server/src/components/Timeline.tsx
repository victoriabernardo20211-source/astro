import type { TimelineStep } from "@/lib/types";
import { Check } from "./icons";

interface TimelineProps {
  steps: TimelineStep[];
}

export default function Timeline({ steps }: TimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const lineColor = step.state === "done" ? "#7B2FBE" : "#E0D2F2";
        return (
          <div
            key={step.key}
            className={`relative flex gap-[18px] ${isLast ? "" : "pb-6"}`}
          >
            {/* connector */}
            {!isLast && (
              <span
                className="absolute bottom-0 left-[10px] top-[22px] w-[2px]"
                style={{ background: lineColor }}
              />
            )}

            {/* node */}
            {step.state === "done" && (
              <span className="z-[1] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-brand-mid">
                <Check size={12} color="#fff" strokeWidth={3.5} />
              </span>
            )}
            {step.state === "current" && (
              <span className="nb-pulse z-[1] h-[22px] w-[22px] flex-none rounded-full border-[3px] border-brand-lavender bg-brand-mid" />
            )}
            {step.state === "future" && (
              <span className="z-[1] h-[22px] w-[22px] flex-none rounded-full border-2 border-[#E0D2F2] bg-white" />
            )}

            {/* content */}
            {step.state === "future" ? (
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-[#B6ACC6]">
                  {step.label}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 justify-between gap-4">
                <div>
                  <div
                    className={`text-[15px] ${
                      step.state === "current"
                        ? "font-extrabold text-brand-mid"
                        : "font-bold text-ink"
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.location && (
                    <div className="mt-[2px] text-[13px] text-muted">
                      {step.location}
                    </div>
                  )}
                </div>
                {step.time && (
                  <div
                    className={`flex-none text-right text-[13px] ${
                      step.state === "current"
                        ? "font-bold text-brand-mid"
                        : "font-semibold text-faint"
                    }`}
                  >
                    {step.time}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
