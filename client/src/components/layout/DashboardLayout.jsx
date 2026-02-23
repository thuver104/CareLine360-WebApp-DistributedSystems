import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    /* cl-page = full-height flex row + gradient background + blobs */
    <div className="cl-page">
      <Sidebar active={activePage} setActive={setActivePage} />

      {/* cl-right-col = flex column, takes remaining width */}
      <div className="cl-right-col">
        <Topbar pageTitle={activePage} />

        {/* cl-main = flex-1 scrollable area */}
        <main className="cl-main p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}