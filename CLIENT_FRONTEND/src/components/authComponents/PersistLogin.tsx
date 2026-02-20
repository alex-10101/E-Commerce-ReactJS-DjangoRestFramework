import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  useAppDispatch,
  useAppSelector,
} from "../../redux-toolkit-config/hooks";
import {
  useCheckUserIsAuthenticatedMutation,
  useLogoutUserMutation,
} from "../../redux-toolkit-config/api-services/authService";
import {
  removeCredentials,
  setCredentials,
} from "../../redux-toolkit-config/slices/authSlice";
// import { apiSlice } from "../../redux toolkit config/services/apiSlice";
import Loader from "../Loader";

/**
 *
 * @returns Component to persist login state after page refresh. Component is used in App.tsx
 */
function PersistLogin() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const [checkUserIsAuthenticated] = useCheckUserIsAuthenticatedMutation();
  const [logout] = useLogoutUserMutation();

  // check when the component mounts if the user is authenticated.
  // If yes, dispatch an action to set the user in the global state.
  // If no, log user out and clear all previous state.
  useEffect(() => {
    async function verifyUserIsAuthenticated() {
      try {
        const data = await checkUserIsAuthenticated().unwrap();
        if (data && data.user && !ignore) {
          dispatch(setCredentials({ ...data }));
        }
      } catch {
        await logout().unwrap();
        dispatch(removeCredentials());
        // dispatch(apiSlice.util.resetApiState());
      } finally {
        setIsLoading(false);
      }
    }

    let ignore = false;

    if (!currentUser) {
      verifyUserIsAuthenticated();
    } else {
      setIsLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return <Loader />;
  }
  return <Outlet />;
}

export default PersistLogin;
