import { customCupDetails } from "@/lib/customCupDisplay";

export default function CustomCupOrderDetails({ name, category }: { name: string; category: string }) {
  const details = customCupDetails(name, category);
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-red-900 bg-white/5">
      <div className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-300">Custom Cup Details</div>
      <dl className="grid grid-cols-2 gap-4 p-4">
        {[["Cup type", details.cup], ["Lid color", details.lid], ["Selected wrap", details.wrap], ["Lid option", details.decoration]].map(([label, value]) => (
          <div key={label} className={label === "Selected wrap" || label === "Lid option" ? "col-span-2" : "min-w-0"}>
            <dt className="text-xs font-bold uppercase tracking-wide text-white/50">{label}</dt>
            <dd className="mt-1 break-words text-sm font-bold text-white">{value}</dd>
          </div>
        ))}
      </dl>
      {details.decorated && <p className="border-t border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-200"><strong>Follow-up needed:</strong> Contact the customer to discuss the lid design and confirm upgrade pricing.</p>}
    </div>
  );
}
