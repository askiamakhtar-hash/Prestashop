"use client";

import { useState, useTransition } from "react";
import { Plus, X, ShieldCheck, ShieldOff } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/auth";
import { createEmployeeAction, toggleEmployeeActiveAction } from "./actions";
import type { Role, User } from "@/lib/types";

const ROLES: Role[] = ["PROPRIETAIRE", "MANAGER", "CAISSIER", "MAGASINIER"];

type AuditLog = {
  id: string;
  action: string;
  details: string | null;
  userName: string;
  createdAt: string;
};

export default function EmployesClient({
  employees,
  logs,
  currentUserId,
  role,
}: {
  employees: User[];
  logs: AuditLog[];
  currentUserId: string;
  role: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOwner = role === "PROPRIETAIRE";

  function toggle(userId: string, active: boolean) {
    startTransition(async () => {
      await toggleEmployeeActiveAction(userId, active);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isOwner && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-[#12b76a] hover:bg-[#0f9d5a] text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Nouvel employé
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
          Équipe
        </div>
        <div className="divide-y divide-slate-100">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-800">
                  {e.name} {e.id === currentUserId && <span className="text-xs text-slate-400">(vous)</span>}
                </div>
                <div className="text-xs text-slate-400">{e.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {ROLE_LABELS[e.role]}
                </span>
                {!e.active && (
                  <span className="text-xs text-red-500 font-medium">Désactivé</span>
                )}
                {isOwner && e.id !== currentUserId && (
                  <button
                    onClick={() => toggle(e.id, !e.active)}
                    disabled={pending}
                    className={`flex items-center gap-1 text-xs font-medium ${
                      e.active ? "text-red-500" : "text-emerald-600"
                    }`}
                  >
                    {e.active ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                    {e.active ? "Désactiver" : "Activer"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
          Journal d&apos;activité
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <div>
                <span className="font-medium text-slate-700">{l.userName}</span>{" "}
                <span className="text-slate-500">{l.action.replaceAll("_", " ").toLowerCase()}</span>
                {l.details && <span className="text-slate-400"> — {l.details}</span>}
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-2">
                {formatDateTime(l.createdAt)}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">Aucune activité.</p>
          )}
        </div>
      </div>

      {showNew && <NewEmployeeModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewEmployeeModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("CAISSIER");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createEmployeeAction({ name, email, phone, password, pin, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">Nouvel employé</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <LabeledInput label="Nom complet" value={name} onChange={setName} />
          <LabeledInput label="Email" value={email} onChange={setEmail} type="email" />
          <LabeledInput label="Téléphone" value={phone} onChange={setPhone} />
          <LabeledInput label="Mot de passe" value={password} onChange={setPassword} type="password" />
          <LabeledInput label="Code PIN (4 chiffres)" value={pin} onChange={setPin} maxLength={4} />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 bg-[#12b76a] hover:bg-[#0f9d5a] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );
}
