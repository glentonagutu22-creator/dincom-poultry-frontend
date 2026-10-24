
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bird,
  ChartNoAxesColumn,
  Wheat,
  FlaskConical,
  Factory,
  ClipboardList,
  Wallet,
  Package,
  Egg,
  ChartPie,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Flocks", path: "/flocks", icon: Bird },
  { label: "Production", path: "/production", icon: ChartNoAxesColumn },
  { label: "Raw Materials", path: "/raw-materials", icon: Package },
  { label: "Feed Formulas", path: "/feed-formulas", icon: FlaskConical },
  { label: "Feed Production", path: "/feed-production", icon: Factory },
  { label: "Feed Consumption", path: "/feed-consumption", icon: ClipboardList },
  { label: "Expenses", path: "/expenses", icon: Wallet },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Egg Sales", path: "/egg-sales", icon: Egg },
  { label: "Reports", path: "/reports", icon: ChartPie },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-y-auto bg-[#111111] text-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/20 px-5 py-6">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/20">
            <Bird size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold tracking-wide">DINCOM</h2>
            <p className="mt-0.5 text-[11px] text-white/90">
              Poultry Management
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg hover:bg-white/15 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <p className="px-5 pb-3 pt-7 text-[11px] font-bold tracking-[1.5px] text-white/80">
          MAIN MENU
        </p>

        <nav
          aria-label="Main navigation"
          className="flex flex-col gap-1 px-3"
        >
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/15 font-semibold text-white shadow-sm"
                    : "text-white hover:bg-white/15"
                }`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 border-t border-white/20 px-5 py-5 text-[11px] text-white/90">
          <Bird size={18} />
          <span>Managing your farm, smarter.</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
