import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../redux-toolkit-config/hooks";

/**
 * @returns A component that protects routes.
 * If user is authenticated and is an admin, allow the user to access the route, otherwise navigate to home page
 */
function PrivateOutletAdmin() {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  return user && user.is_staff ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} />
  );
}

export default PrivateOutletAdmin;
