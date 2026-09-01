"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form
      action={formAction}
      className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl"
    >
      <input type="hidden" name="next" value={nextPath} />
      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="vous@gestashop.sn"
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12b76a]"
        />
      </div>
      <div className="mb-5">
        <label className="block text-sm text-slate-300 mb-1">Mot de passe</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12b76a]"
        />
      </div>
      {state.error && (
        <p className="mb-4 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#12b76a] hover:bg-[#0f9d5a] transition text-white font-semibold py-2.5 disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
