import Link from "next/link";

export function PanelHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="font-bold text-brand-700">
          EProfile
        </Link>
        <span className="text-slate-300">/</span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <a
            href="/logout"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cerrar sesión
          </a>
        </div>
      </div>
    </header>
  );
}
