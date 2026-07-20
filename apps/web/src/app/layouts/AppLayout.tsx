import { Outlet } from "react-router-dom";

import { AppHeader } from "../../widgets/app-header/AppHeader";

export function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
