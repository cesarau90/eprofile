"use client";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print text-sm font-medium text-brand-600 hover:underline"
    >
      {label}
    </button>
  );
}
