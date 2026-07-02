import { Container, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";

import { routes } from "../../shared/routes/paths";
import { GlobalSearch } from "../global-search/GlobalSearch";

export function AppHeader() {
  return (
    <Navbar bg="white" className="border-bottom">
      <Container className="gap-3">
        <Navbar.Brand as={Link} to={routes.home} className="fw-semibold">
          CV Management Platform
        </Navbar.Brand>
        <div className="app-header__search ms-auto">
          <GlobalSearch />
        </div>
      </Container>
    </Navbar>
  );
}
