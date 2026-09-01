import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="GestaShop.sn" className="w-11 h-11 rounded-xl" />
            <span className="text-2xl font-extrabold text-white">
              GESTA<span className="text-[#12b76a]">SHOP</span>
              <span className="text-white">.SN</span>
            </span>
          </div>
          <p className="text-xs tracking-wide text-slate-400 uppercase">
            Votre commerce. Votre stock. Votre caisse.
          </p>
        </div>
        <LoginForm nextPath={params.next ?? "/dashboard"} />
        <div className="mt-6 rounded-lg bg-slate-800/50 border border-slate-700 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Comptes de démonstration</p>
          <p>Propriétaire : yade@gestashop.sn / demo1234</p>
          <p>Manager : fatou@gestashop.sn / demo1234</p>
          <p>Caissier : moussa@gestashop.sn / demo1234</p>
          <p>Magasinier : ibou@gestashop.sn / demo1234</p>
        </div>
      </div>
    </div>
  );
}
