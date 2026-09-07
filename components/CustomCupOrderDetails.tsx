import { customCupDetails } from "@/lib/customCupDisplay";

export default function CustomCupOrderDetails({ name, category }: { name: string; category: string }) {
  const details = customCupDetails(name, category);
  const lidLabel = `${details.lid.replace(/\s+lid$/i, "")} Lid`;
  const decorationLabel = details.decorated ? "Decorated Lid" : "Standard Lid";

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-red-900 bg-gradient-to-b from-red-950/35 to-white/[0.03]">
      <div className="space-y-2 px-5 py-5">
        <p className="text-lg font-black text-white">{details.cup}</p>
        <p className="text-lg font-black text-white">{lidLabel}</p>
        <p className="text-lg font-black text-white">{decorationLabel}</p>
      </div>

      {details.decorated && (
        <div className="border-t border-red-900 bg-black/35 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-300">
            Decorated Lid
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Check the customer&apos;s Order Notes for a specific lid design. If no lid design is requested, Pressed In Pink can design the decorated lid at her discretion.
          </p>
        </div>
      )}
    </div>
  );
}
