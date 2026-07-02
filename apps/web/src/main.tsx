import "bootstrap/dist/css/bootstrap.min.css";
import "./app/styles/global.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router/AppRouter";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AppProviders>
      <Suspense fallback={<div className="container py-4">Loading...</div>}>
        <AppRouter />
      </Suspense>
    </AppProviders>
  </StrictMode>
);
