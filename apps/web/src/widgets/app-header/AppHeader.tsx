import { Stack } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

import { useCurrentUser } from "../../entities/user/model/use-current-user";
import { LogoutButton } from "../../features/logout/ui/LogoutButton";
import { routes } from "../../shared/routes/paths";

type MainNavItem = {
  label: string;
  to: string;
  end?: boolean;
  visible: boolean;
};

export function AppHeader() {
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data?.authenticated ? currentUserQuery.data.user : null;
  const roleCodes = currentUser?.roles.map((role) => role.code) ?? [];
  const isAdmin = roleCodes.includes("ADMIN");
  const canUseProfile = roleCodes.includes("CANDIDATE") || isAdmin;
  const canUseAttributes = roleCodes.includes("RECRUITER") || isAdmin;
  const mainNavItems: MainNavItem[] = [
    { label: "Home", to: routes.home, end: true, visible: true },
    { label: "Attributes", to: routes.attributes, visible: canUseAttributes },
    { label: "Profile", to: routes.profile, visible: canUseProfile },
    { label: "Positions", to: routes.positions, visible: true }
  ];

  return (
    <>
      <aside className="app-sidebar">
        <Link to={routes.home} className="app-sidebar__brand">
          <span className="app-sidebar__mark">CV</span>
          <span>CV Platform</span>
        </Link>

        <nav className="app-sidebar__nav" aria-label="Main navigation">
          {mainNavItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? "app-sidebar__link app-sidebar__link--active" : "app-sidebar__link"
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}

          {isAdmin ? (
            <NavLink
              className={({ isActive }) =>
                isActive ? "app-sidebar__link app-sidebar__link--active" : "app-sidebar__link"
              }
              to={routes.adminUsers}
            >
              Admin Users
            </NavLink>
          ) : null}
        </nav>
      </aside>

      <header className="app-topbar">
        <div>
          <div className="app-topbar__eyebrow">Workspace</div>
          <div className="app-topbar__caption">Role-aware CV management</div>
        </div>

        <div className="app-header__auth">
          {currentUser ? (
            <Stack direction="horizontal" gap={2} className="align-items-center">
              <span className="app-header__user-name text-truncate">{currentUser.displayName}</span>
              <LogoutButton />
            </Stack>
          ) : (
            <Link to={routes.signIn} className="btn btn-primary btn-sm text-nowrap">
              Sign in
            </Link>
          )}
        </div>
      </header>
    </>
  );
}
