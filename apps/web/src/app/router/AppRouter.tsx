import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";

const HomePage = lazy(() => import("../../pages/home/HomePage"));
const SignInPage = lazy(() => import("../../pages/sign-in/SignInPage"));
const AdminUsersPage = lazy(() => import("../../pages/admin-users/ui/AdminUsersPage"));
const AttributeLibraryPage = lazy(
  () => import("../../pages/attribute-library/ui/AttributeLibraryPage")
);
const CvPreviewPage = lazy(() => import("../../pages/cv-preview/ui/CvPreviewPage"));
const ProfilePage = lazy(() => import("../../pages/profile/ui/ProfilePage"));
const PositionsPage = lazy(() => import("../../pages/positions/ui/PositionsPage"));

const router = createBrowserRouter([
  {
    path: "/sign-in",
    element: <SignInPage />
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "attributes",
        element: <AttributeLibraryPage />
      },
      {
        path: "profile",
        element: <ProfilePage />
      },
      {
        path: "positions",
        element: <PositionsPage />
      },
      {
        path: "cvs/preview/:positionId",
        element: <CvPreviewPage />
      },
      {
        path: "admin/users",
        element: <AdminUsersPage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
