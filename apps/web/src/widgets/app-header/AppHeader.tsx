import { Container, Nav, Navbar, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useCurrentUser } from "../../entities/user/model/use-current-user";
import { LogoutButton } from "../../features/logout/ui/LogoutButton";
import { routes } from "../../shared/routes/paths";
import { GlobalSearch } from "../global-search/GlobalSearch";

export function AppHeader() {
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data?.authenticated ? currentUserQuery.data.user : null;

  return (
    <Navbar bg="white" className="border-bottom">
      <Container className="gap-3 flex-wrap">
        <Navbar.Brand as={Link} to={routes.home} className="fw-semibold">
          CV Management Platform
        </Navbar.Brand>
        <Nav className="app-header__nav">
          <Nav.Link as={Link} to={routes.attributes}>
            Attributes
          </Nav.Link>
          <Nav.Link as={Link} to={routes.profile}>
            Profile
          </Nav.Link>
          <Nav.Link as={Link} to={routes.positions}>
            Positions
          </Nav.Link>
        </Nav>
        <div className="app-header__search ms-auto">
          <GlobalSearch />
        </div>
        <div className="app-header__auth">
          {currentUser ? (
            <Stack direction="horizontal" gap={2} className="align-items-center">
              <span className="app-header__user-name text-truncate">{currentUser.displayName}</span>
              <LogoutButton />
            </Stack>
          ) : (
            <Nav.Link as={Link} to={routes.signIn} className="text-nowrap">
              Sign in
            </Nav.Link>
          )}
        </div>
      </Container>
    </Navbar>
  );
}
