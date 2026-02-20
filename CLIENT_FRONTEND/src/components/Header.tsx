import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useAppDispatch, useAppSelector } from "../redux-toolkit-config/hooks";
import {
  selectTheme,
  setTheme,
} from "../redux-toolkit-config/slices/themeSlice";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useLogoutUserMutation } from "../redux-toolkit-config/api-services/authService";
import { removeCredentials } from "../redux-toolkit-config/slices/authSlice";
import { apiSlice } from "../redux-toolkit-config/apiSlice";
import Offcanvas from "react-bootstrap/esm/Offcanvas";
import Button from "react-bootstrap/esm/Button";
import FilterCheckboxes from "./FilterCheckboxes";
import FetchBaseError from "./FetchBaseError";

/**
 *
 * @returns The navbar of the application.
 */
function Header() {
  //   const theme = useAppSelector((state) => state.theme.theme); // read the theme color from the global state
  const theme = useAppSelector(selectTheme); // read the theme color from the global state

  const userInfo = useAppSelector((state) => state.auth.user);

  const dispatch = useAppDispatch();

  const [logout, { error: logoutError }] = useLogoutUserMutation();

  const [showOffcanvas, setShowOffcanvas] = useState(false);

  function handleCloseOffcanvas() {
    setShowOffcanvas(false);
  }

  function handleShowOffcanvas() {
    setShowOffcanvas(true);
  }

  // Apply Bootstrap theme to the whole document
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  /**
   * When a user selects a theme System Defaults / Light / Dark from the dropdown,
   * it triggers this function which sends the theme selected by the user to the global state.
   *
   * Afterwards the theme color will also change according to the user's preference.
   *
   * @param optionFieldValue system / light / dark
   */
  function handleChangeTheme(optionFieldValue: string) {
    if (optionFieldValue === "system") {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        dispatch(setTheme("dark"));
      } else {
        dispatch(setTheme("light"));
      }
    } else {
      dispatch(setTheme(optionFieldValue));
    }
  }

  /**
   * Make a POST request to log out when the user clicks "Log Out".
   * Then remove all user info.
   */
  async function handleLogout(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();
    await logout().unwrap();
    dispatch(removeCredentials());
    dispatch(apiSlice.util.resetApiState());
  }

  return (
    <header className="sticky-top">
      <Navbar
        expand="lg"
        variant={theme}
        bg={theme}
        collapseOnSelect
        // sticky="top"
      >
        <Container>
          {/* Go to the homepage when the user presses the ProShop text. */}
          <Navbar.Brand as={Link} to="/">
            ProShop
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Go to the cart page when the user presses the cart button. */}
              <Nav.Link as={Link} to="/cart">
                <i className="fas fa-shopping-cart"></i> Cart
              </Nav.Link>
              {userInfo ? (
                <NavDropdown title={userInfo.username} id="username">
                  <NavDropdown.Item as={Link} to="/profile">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/changeKnownPassword">
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/deleteAccount">
                    Delete Account
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login">
                  Log In
                </Nav.Link>
              )}

              {userInfo && userInfo.is_staff && (
                <NavDropdown title="Admin" id="adminmenu">
                  <NavDropdown.Item as={Link} to="/admin/userlist">
                    Users
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/admin/productlist">
                    Products
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/admin/orders">
                    Orders
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>

            {logoutError && <FetchBaseError error={logoutError} />}

            <Button
              onClick={handleShowOffcanvas}
              className="me-2"
              variant={theme}
            >
              Filters
            </Button>

            {/* The offcanvas with the checkboxes */}
            {/* The checkboxes are used for filtering the car notes. */}
            <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas}>
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>Filters</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <FilterCheckboxes />
              </Offcanvas.Body>
            </Offcanvas>

            {/* Theme dropdown with options: System Defaults / Light / Dark */}
            <Form.Select
              aria-label="Theme"
              value={theme}
              onChange={(e) => handleChangeTheme(e.target.value)}
              style={{ width: 160 }}
              className={
                theme === "dark" ? "bg-dark text-light border-secondary" : ""
              }
            >
              <option value="system">System Defaults</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Form.Select>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}

export default Header;
