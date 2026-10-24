
import { useState } from "react";
import { Bird } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MovingImageBackground from "../MovingImageBackground";

function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-white">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[260px]">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="relative isolate w-full min-w-0 flex-1 overflow-hidden">
          <MovingImageBackground />

          <div className="relative z-10 min-h-full p-4 sm:p-6 lg:p-7">
            {children}
          </div>
        </main>

        <footer className="flex flex-col gap-3 border-t-[3px] border-white/15 bg-black px-5 py-5 text-xs text-neutral-300 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-2 font-bold text-white">
            <Bird size={19} />
            <span>DINCOM Poultry Management</span>
          </div>

          <div className="flex flex-col gap-1 text-neutral-400 sm:items-end">
            <span>
              © {new Date().getFullYear()} DINCOM. All rights reserved.
            </span>
            <span>Built for smarter poultry farming.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
