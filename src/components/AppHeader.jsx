export default function AppHeader({ title, subtitle, actions }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between gap-unit-3">
        <div className="flex flex-col min-w-0">
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-tight truncate">
            {title}
          </span>
          {subtitle && (
            <span className="font-label-md text-label-md text-on-surface-variant leading-none truncate">
              {subtitle}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-unit-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
