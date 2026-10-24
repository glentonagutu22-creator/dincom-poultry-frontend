
import { Construction } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";

function ModulePlaceholder({ title }) {
  return (
    <DashboardLayout>
      <section className="mb-7">
        <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-[#D96F12]">
          FARM MANAGEMENT
        </p>

        <h2 className="text-2xl font-extrabold tracking-tight text-[#252525] sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          This section will help you manage {title.toLowerCase()}. We'll
          build the interface and connect it to the backend next.
        </p>
      </section>

      <section className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
        <div className="grid size-16 place-items-center rounded-2xl bg-orange-50 text-[#D96F12]">
          <Construction size={30} />
        </div>

        <h3 className="mt-5 text-lg font-bold text-[#252525]">
          {title} page is under development
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          The navigation is ready. We'll add the tables, forms, and
          backend integration for this module in a later step.
        </p>
      </section>
    </DashboardLayout>
  );
}

export default ModulePlaceholder;
