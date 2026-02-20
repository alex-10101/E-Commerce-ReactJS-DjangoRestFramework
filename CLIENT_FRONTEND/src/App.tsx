import Container from "react-bootstrap/Container";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import Register from "./pages/authPages/Register";
import ActivateAccount from "./pages/authPages/ActivateAccount";
import Login from "./pages/authPages/Login";
import RequestChangeForgottenPassword from "./pages/authPages/RequestChangeForgottenPassword";
import ConfirmChangeForgottenPassword from "./pages/authPages/ConfirmChangeForgottenPassword";
import { useEffect } from "react";
import PersistLogin from "./components/authComponents/PersistLogin";
import ProfilePage from "./pages/ProfilePage";
import PrivateOutlet from "./components/authComponents/PrivateOutlet";
import ChangeKnownPassword from "./pages/authPages/ChangeKnownPassword";
import DeleteAccount from "./pages/authPages/DeleteAccount";
import ShippingPage from "./pages/ShippingPage";
import PaymentPage from "./pages/PaymentPage";
import PlaceOrderPage from "./pages/PlaceOrderPage";
import OrderPage from "./pages/OrderPage";
import UserListPage from "./pages/adminPages/UserListPage";
import PrivateOutletAdmin from "./components/authComponents/PrivateOutletAdmin";
import UserEditPage from "./pages/adminPages/UserEditPage";
import ProductListPage from "./pages/adminPages/ProductListPage";
import ProductEditPage from "./pages/adminPages/ProductEditPage";
import ProductCreatePage from "./pages/adminPages/ProductCreatePage";
import OrderListPage from "./pages/adminPages/OrderListPage";

function App() {
  // When the component mounts, get the CSRF cookie.
  useEffect(() => {
    async function getCSRFCookie() {
      try {
        const result = await fetch(
          "http://localhost:8000/api/auth/csrf_cookie",
          {
            method: "GET",
            credentials: "include",
          },
        );
        const res = await result.json();
        console.log(res);
      } catch (err) {
        // If the CSRF cookie is set, this may return an undefined error {} and output an
        // SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data.
        // But the CSRF cookie is still set, so no issues.
        console.log(err);
      }
    }

    getCSRFCookie();
  }, []);

  return (
    <BrowserRouter>
      <div>
        {/* Displays the header of the app. */}
        <Header />
        <main>
          {/* Container with padding of 3 both on top and bottom. */}
          <Container className="py-3">
            {/* The routes of the application. */}
            <Routes>
              <Route element={<PersistLogin />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart/:id?" element={<CartPage />} />
                <Route path="register" element={<Register />} />
                <Route
                  path="activate/:uid/:token/"
                  element={<ActivateAccount />}
                />
                <Route path="login" element={<Login />} />
                <Route
                  path="requestChangeForgottenPassword"
                  element={<RequestChangeForgottenPassword />}
                />
                <Route
                  path="confirmChangeForgottenPassword/:uid/:token"
                  element={<ConfirmChangeForgottenPassword />}
                />
                <Route
                  path="changeKnownPassword"
                  element={<ChangeKnownPassword />}
                />
                <Route path="deleteAccount" element={<DeleteAccount />} />

                {/* This pages require the user to be authenticated */}
                <Route path="" element={<PrivateOutlet />}>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="shipping" element={<ShippingPage />} />
                  <Route path="payment" element={<PaymentPage />} />
                  <Route path="placeorder" element={<PlaceOrderPage />} />
                  <Route path="order/:id" element={<OrderPage />} />

                  {/* This pages require the authenticated user to be an admin */}
                  <Route path="/admin" element={<PrivateOutletAdmin />}>
                    <Route path="userlist" element={<UserListPage />} />
                    <Route path="user/:id/edit" element={<UserEditPage />} />
                    <Route path="productlist" element={<ProductListPage />} />
                    <Route
                      path="createProduct"
                      element={<ProductCreatePage />}
                    />
                    <Route
                      path="product/:id/edit"
                      element={<ProductEditPage />}
                    />
                    <Route path="orders" element={<OrderListPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Container>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
