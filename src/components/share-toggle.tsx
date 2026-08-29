"use client";

interface ShareToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ShareToggle({ checked, onChange }: ShareToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        className={`w-10 h-6 border-2 border-primary flex items-center transition-colors ${
          checked ? "bg-secondary-container" : "bg-surface-container-low"
        }`}
      >
        <div
          className={`w-4 h-4 border-2 border-primary transition-transform mx-0.5 ${
            checked ? "translate-x-4 bg-primary" : "bg-surface"
          }`}
        />
      </div>
      <span className="text-[14px] font-bold uppercase tracking-[0.05em] flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px]">group</span>
        Bagikan ke teman
      </span>
    </label>
  );
}
