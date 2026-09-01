"use client";

import { useState, useTransition } from "react";
import { updateStoreInfoAction } from "./actions";
import type { Store } from "@/lib/types";

export default function ParametresClient({
  store,
  canEdit,
}: {
  store: Store;
  canEdit: boolean;
}) {
  const [name, setName] = useState(store.name);
  const [city, setCity] = useState(store.city ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateStoreInfoAction({ name, city });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Informations de la boutique</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nom de la boutique</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ville</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!canEdit}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
      </div>
      {canEdit && (
        <button
          onClick={submit}
          disabled={pending}
          className="mt-4 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
      {saved && <p className="text-xs text-emerald-600 mt-2">Enregistré.</p>}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
