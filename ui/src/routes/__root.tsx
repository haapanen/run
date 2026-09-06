import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import logo from "../assets/logo.svg";

const RootLayout = () => (
  <>
    <header className="site-header">
      <Link to="/paces" className="site-brand" aria-label="Run home">
        <img src={logo} alt="" />
        <span>Run</span>
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        <Link
          to="/paces"
          activeProps={{ "aria-current": "page" }}
          className="site-nav-link"
        >
          Paces
        </Link>
        <Link
          to="/prediction"
          activeProps={{ "aria-current": "page" }}
          className="site-nav-link"
        >
          Prediction
        </Link>
      </nav>
    </header>
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
