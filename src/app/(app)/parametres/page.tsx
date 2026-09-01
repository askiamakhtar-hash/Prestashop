import { requireSection } from "@/lib/guard";
import { getStore } from "@/lib/repositories/stores";
import { getUser } from "@/lib/repositories/users";
import { ROLE_LABELS } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import ParametresClient from "./ParametresClient";

export default async function ParametresPage() {
  const session = await requireSection("parametres");
  const store = getStore(session.storeId);
  const user = getUser(session.userId);

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Boutique, profil et abonnement" />
      <div className="p-4 md:p-8 max-w-2xl space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Mon profil</h3>
          <div className="text-sm space-y-1 text-slate-600">
            <div>
              <span className="text-slate-400">Nom : </span>
              {user?.name}
            </div>
            <div>
              <span className="text-slate-400">Email : </span>
              {user?.email}
            </div>
            <div>
              <span className="text-slate-400">Rôle : </span>
              {ROLE_LABELS[session.role]}
            </div>
          </div>
        </div>

        {store && (
          <ParametresClient store={store} canEdit={session.role === "PROPRIETAIRE"} />
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Abonnement</h3>
          <p className="text-sm text-slate-500">
            Plan actuel : <span className="font-semibold text-slate-800">Business</span> — 10 000
            FCFA/mois
          </p>
          <p className="text-xs text-slate-400 mt-1">
            3 utilisateurs, 5 000 produits, Wave/Orange Money, clients &amp; crédits, rapports
            avancés.
          </p>
        </div>
      </div>
    </div>
  );
}
