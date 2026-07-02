import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";

const HomePage = lazy(() => import("../../pages/home/HomePage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
