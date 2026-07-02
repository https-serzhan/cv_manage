import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

import { AppHeader } from "../../widgets/app-header/AppHeader";

export function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main>
        <Container className="py-4">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
