
import { Menu, Bell, UserRound } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[74px] items-center justify-between gap-3 bg-[#111111] px-4 py-3 text-white shadow-sm sm:px-6 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/15 hover:bg-white/25 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[1.5px] text-white/85 sm:text-[10px]">
            DINCOM FARM SYSTEM
          </p>
          <h1 className="truncate text-lg font-bold sm:text-xl">
            Farm Management
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="grid size-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25 sm:size-10"
        >
          <Bell size={20} />
        </button>

        <div
          title="Account"
          className="grid size-9 place-items-center rounded-full border border-white/50 bg-white/15 sm:size-10"
        >
          <UserRound size={20} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
