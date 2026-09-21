"use client";

import { useEffect, useState } from "react";
import StorefrontFrame from "@/components/StorefrontFrame";
import WrapGallery from "@/components/WrapGallery";
import { useCart } from "@/components/CartProvider";
import { wrapCategories } from "@/data/wrapCategories";
import { supabase } from "@/lib/supabase";
import type { WrapCategoryConfig } from "@/types/wraps";
import type { WrapProduct } from "@/types/cart";

import { CUSTOM_CUPS, CUSTOM_LIDS, CUSTOM_CUP_CATEGORIES, blankCupHasColoredLids } from "@/lib/blankCups";

const draftKey = "pnp-custom-cup-draft-v2";
const regular = (slug: string) => !/^(mini(?:[-_]?uv|$)|sanitizer|cup-|custom-cup|glitter|blank)/.test(slug);
const choice = "rounded-2xl border px-5 py-5 text-left font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400";

export default function CustomCupPage() {
  const { addItem, isReady } = useCart();
  const [cup, setCup] = useState("");
  const [cupCategory, setCupCategory] = useState("acrylic");
  const selectedCup = CUSTOM_CUPS.find(product => product.id === cup);
  const hasLidOptions = !!selectedCup && blankCupHasColoredLids(selectedCup);
  const [wrap, setWrap] = useState<WrapProduct | null>(null);
  const [color, setColor] = useState("");
  const selectedLid = CUSTOM_LIDS.find(product => product.id === color);
  const [decorated, setDecorated] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [picker, setPicker] = useState(false);
  const [category, setCategory] = useState<WrapCategoryConfig | null>(null);
  const [categories, setCategories] = useState<WrapCategoryConfig[]>(Object.values(wrapCategories));
  const [search, setSearch] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (saved) {
        const savedCup = CUSTOM_CUPS.find(product => product.id === saved.cup);
        if (savedCup) {
          setCup(savedCup.id);
          setCupCategory(savedCup.categorySlug.replace("blank-", ""));
          if (blankCupHasColoredLids(savedCup)) {
            if (CUSTOM_LIDS.some(product => product.id === saved.color)) setColor(saved.color);
            if (typeof saved.decorated === "boolean") setDecorated(saved.decorated);
          }
        }
        if (saved.wrap && typeof saved.wrap.id === "string" && typeof saved.wrap.categorySlug === "string" && regular(saved.wrap.categorySlug)) setWrap(saved.wrap);
      }
    } catch { /* A fresh draft is safe if browser storage is unavailable. */ }
    setHydrated(true);
    let active = true;
    void supabase.from("catalog_categories").select("*").eq("is_active", true).then(({ data, error }) => {
      if (!active) return;
      if (error) { setCatalogError("Additional categories could not load. Refresh to try again; the main catalog is still available."); return; }
      const merged = new Map<string, WrapCategoryConfig>(Object.values(wrapCategories).map(c => [c.slug, c]));
      for (const row of data || []) {
        if (!regular(row.slug) || row.slug === "sports" || (row.parent_slug && row.parent_slug !== "sports")) continue;
        const existing = merged.get(row.slug);
        merged.set(row.slug, existing || {
          slug: row.slug, displayName: row.display_name, heading: row.heading,
          itemLabel: row.item_label, filenamePrefix: row.filename_prefix,
          imageFolder: row.image_folder, totalImages: row.base_image_count,
          backHref: "/custom-cup", backLabel: "Back to Custom Cup",
          footerHref: "/custom-cup", footerLabel: "Return to Custom Cup",
        });
      }
      setCategories([...merged.values()].filter(c => regular(c.slug)).sort((a,b) => a.displayName.localeCompare(b.displayName)));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ cup, wrap, color, decorated })); } catch { /* Keep the current in-memory draft. */ }
    setAdded(false);
  }, [cup, wrap, color, decorated, hydrated]);

  useEffect(() => {
    if (!picker) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setPicker(false); setCategory(null); } };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [picker]);

  const complete = !!selectedCup && !!wrap && (!hasLidOptions || (!!selectedLid && decorated !== null));
  const titles = ["Choose your cup", "Choose your wrap", "Choose your lid color", "Make your lid special"];
  const summaries = [selectedCup?.displayName, wrap?.displayName, selectedLid?.displayName, decorated === null ? "" : decorated ? "Decorated lid · Order Notes are optional" : "Standard lid"];
  const available = [true, !!cup, !!cup && !!wrap, !!cup && !!wrap && !!color];

  function addCup() {
    if (!complete || !wrap || !selectedCup || !isReady) return;
    const id = `custom-cup-${crypto.randomUUID()}`;
    addItem({ ...wrap, id, categorySlug: id,
      displayName: `${selectedCup.displayName} (${selectedCup.sourceFilename.replace(/\.[^.]+$/, "")}) | ${hasLidOptions ? `${selectedLid?.displayName} lid` : "No lid customization"} | ${hasLidOptions && decorated ? "Decorated lid" : hasLidOptions ? "Standard lid" : "Not applicable"}`,
      categoryName: `Custom Cup · Wrap: ${wrap.displayName}`.slice(0,160),
      productType: "cup", mediaType: "image", isOneOfOne: false,
      detailHref: "/custom-cup",
    }, 1);
    setAdded(true);
  }

  return (
    <StorefrontFrame backLink={{href:"/premade",label:"Custom & Premade"}}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <header className="mb-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Made for you</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">Build Your Cup</h1>
          <p className="mx-auto mt-5 max-w-xl text-white/75">Your cup, your wrap, your finishing touch. We’ll review your request and confirm pricing on your invoice.</p>
        </header>
        <div className="space-y-4">
          {titles.map((title, index) => (index > 1 && !hasLidOptions ? null : (
            <section key={title} className="overflow-hidden rounded-3xl border border-red-900 bg-black/90">
              <h2><button type="button" disabled={!available[index]} aria-expanded={step===index} aria-controls={`cup-step-${index}`} onClick={()=>setStep(index)} className="flex w-full items-center gap-4 p-6 text-left disabled:opacity-40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500 font-black">{index+1}</span>
                <span className="flex-1"><span className="block text-xl font-black">{title}</span>{summaries[index] && <span className="mt-1 block text-sm text-red-300">{summaries[index]}</span>}</span><span aria-hidden="true">{step===index ? "−" : "+"}</span>
              </button></h2>
              {step===index && <div id={`cup-step-${index}`} className="border-t border-white/10 p-6">
                {index===0 && <><label className="mb-5 block font-bold">Cup category<select value={cupCategory} onChange={event=>setCupCategory(event.target.value)} className="mt-2 block w-full rounded-xl border border-red-900 bg-black p-3">{CUSTOM_CUP_CATEGORIES.map(c=><option key={c.slug} value={c.slug}>{c.displayName}</option>)}</select></label><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{CUSTOM_CUPS.filter(product=>product.categorySlug===`blank-${cupCategory}`).map(product=><button key={product.id} aria-pressed={cup===product.id} className={`${choice} ${cup===product.id ? "border-red-500 bg-red-950" : "border-white/20 bg-white/5 hover:border-red-500"}`} onClick={()=>{setCup(product.id);setColor("");setDecorated(null);setStep(1)}}><img src={product.thumbnailUrl} alt={product.displayName} loading="lazy" className="mb-3 aspect-square w-full rounded-xl object-cover"/>{product.displayName}<span className="mt-2 block text-sm font-normal text-white/70">{blankCupHasColoredLids(product) ? "Colored lids available" : "No lid customization"}</span></button>)}</div></> }
                {index===1 && <><p className="mb-5 text-white/70">Choose from our regular UV-DTF collection. We’ll confirm the design fits your selected cup when reviewing your request.</p><button className="rounded-full bg-red-600 px-6 py-3 font-black" onClick={()=>{setPicker(true);setCategory(null)}}>{wrap ? "Change wrap" : "Browse UV-DTF wraps"}</button>{wrap && <button className="ml-4 rounded-full border border-red-600 px-6 py-3 font-bold" onClick={()=>setStep(hasLidOptions ? 2 : 4)}>Continue</button>}</>}
                {index===2 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{CUSTOM_LIDS.map(product=><button key={product.id} aria-pressed={color===product.id} className={`${choice} ${color===product.id ? "border-red-500 bg-red-950" : "border-white/20 bg-white/5"}`} onClick={()=>{setColor(product.id);setStep(3)}}><img src={product.thumbnailUrl} alt={`${product.displayName} lid`} loading="lazy" className="mb-3 aspect-square w-full rounded-xl object-contain"/>{product.displayName}</button>)}</div>}
                {index===3 && <><p className="mb-5 text-white/70">Want a decorated lid? If you want a specific lid design, add it to your Order Notes at checkout. If you leave the notes blank, Pressed In Pink will design the decorated lid at her discretion.</p><div className="grid gap-3 sm:grid-cols-2">{[false,true].map(value=><button key={String(value)} className={`${choice} ${decorated===value ? "border-red-500 bg-red-950" : "border-white/20 bg-white/5"}`} onClick={()=>{setDecorated(value);setStep(4)}}>{value ? "Add a custom decorated lid" : "Keep the standard lid"}</button>)}</div></>}
              </div>}
            </section>
          )))}
        </div>
        {complete && <section className="mt-8 rounded-3xl border border-red-500 bg-black/95 p-6"><h2 className="text-2xl font-black">Your Custom Cup</h2><p className="mt-4">{selectedCup?.displayName} · {hasLidOptions ? `${selectedLid?.displayName} lid` : "No lid customization"}</p><p className="mt-2 text-white/75">Wrap: {wrap?.displayName}</p><p className="mt-2 text-white/75">{!hasLidOptions ? "This cup has no lid customization options." : decorated ? "Decorated lid selected. Add a specific design in your Order Notes at checkout, or leave them blank and PNP will design the lid at her discretion." : "Standard lid selected."}</p><p className="my-5 text-sm text-red-300">Final pricing confirmed after review. No payment is collected now.</p>{added ? <a href="/cart" className="inline-block rounded-full bg-red-600 px-6 py-3 font-black">Added! View Request Cart →</a> : <button disabled={!isReady} onClick={addCup} className="rounded-full bg-red-600 px-6 py-3 font-black disabled:opacity-50">Add Custom Cup to Request</button>}</section>}
      </div>
      {picker && <div role="dialog" aria-modal="true" aria-label="Choose a UV-DTF wrap" onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')).filter(element => element.offsetParent !== null);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }} className="fixed inset-0 z-[100] overflow-y-auto bg-black text-white">
        <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-between gap-3 border-b border-red-900 bg-black p-4"><button autoFocus onClick={()=>{if(category) setCategory(null); else setPicker(false)}} className="rounded-full border border-red-600 px-5 py-2 font-bold">{category ? "← All wrap categories" : "← Back to my cup"}</button><button onClick={()=>setPicker(false)} className="rounded-full border border-white/30 px-5 py-2">Close picker</button></div>
        {category ? <WrapGallery category={category} onSelectWrap={product=>{setWrap(product);setPicker(false);setCategory(null);setStep(hasLidOptions ? 2 : 4)}}/> : <div className="mx-auto max-w-6xl p-6"><h2 className="text-3xl font-black">Find Your Wrap</h2><p className="my-4 text-white/70">Pick a category, browse the designs, and choose your favorite. Your cup selections are saved.</p>{catalogError && <p role="alert" className="mb-4 text-red-300">{catalogError}</p>}<input aria-label="Search wrap categories" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search characters, teams, themes…" className="mb-6 w-full rounded-2xl border border-red-900 bg-white/5 px-5 py-4"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.filter(c=>c.displayName.toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.slug} onClick={()=>setCategory(c)} className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-left text-xl font-black hover:border-red-500">{c.displayName} →</button>)}</div></div>}
      </div>}
    </StorefrontFrame>
  );
}
