import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Studies", icon: "folder_shared" },
  { to: "/study/new", label: "New Study", icon: "add_circle" },
  { to: "/account", label: "Account", icon: "tune" },
];

function navLinkClasses({ isActive }) {
  return [
    "flex items-center gap-unit-3 min-h-[44px] px-unit-3 py-unit-2 rounded-xl transition-colors font-label-lg text-label-lg",
    isActive
      ? "bg-primary-fixed text-primary font-semibold"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
  ].join(" ");
}

function mobileNavLinkClasses({ isActive }) {
  return [
    "flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-unit-1 px-unit-2 rounded-xl transition-colors",
    isActive ? "text-primary font-semibold" : "text-on-surface-variant hover:text-on-surface",
  ].join(" ");
}

export default function Sidebar() {
  return (
    <>
      {/* Desktop side rail */}
      <nav className="hidden md:flex flex-col w-60 shrink-0 border-r border-outline-variant/40 bg-surface-container-lowest px-unit-3 py-unit-6 gap-unit-1">
        <div className="flex items-center gap-unit-2 px-unit-2 mb-unit-6">
          <span className="material-symbols-outlined text-primary text-[28px]">monitoring</span>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">StudyPulse</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClasses}>
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center h-20 px-unit-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={mobileNavLinkClasses}>
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-md text-label-md mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
