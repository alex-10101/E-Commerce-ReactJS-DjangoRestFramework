import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux-toolkit-config/hooks";
import {
  addToCart,
  removeFromCart,
} from "../redux-toolkit-config/slices/cartSlice";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import type { IProduct } from "../types/types";
import { selectTheme } from "../redux-toolkit-config/slices/themeSlice";

/**
 *
 * @returns A page, which displays all items in the shopping cart.
 */
function CartPage() {
  const navigate = useNavigate();

  const theme = useAppSelector(selectTheme); // read the theme color from the global state
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.cartItems);

  /**
   * When the user clicks the "Add to cart" button,
   * it triggers this function which dispatches an action
   * to add the item to the shopping cart and update the global state.
   *
   * @param product all properties of a product, excepting its user, rating and numReviews
   * @param qty the quantity of a product in the shopping cart
   */
  function addToCartHandler(
    product: Omit<IProduct, "user" | "rating" | "numReviews">,
    qty: number,
  ) {
    dispatch(addToCart({ ...product, qty }));
  }

  /**
   * When the user clicks the "Remove item" button,
   * it triggers this function which dispatches an action
   * to remove the item from the shopiing cart and update the global state.
   * @param id
   */
  function removeFromCartHandler(id: number) {
    dispatch(removeFromCart(id));
  }

  /**
   * When the user clicks the "Proceed To Checkout",
   * it triggers this function which redirects the user
   * to the checkout page.
   */
  function checkoutHandler() {
    navigate("/shipping");
  }

  return (
    // a row which contains three columns
    <Row>
      {/* First column contains some information about the product */}
      <Col md={8}>
        <h1 style={{ marginBottom: "20px" }}>Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <p>
            Your cart is empty <Link to="/">Go Back</Link>
          </p>
        ) : (
          // From the Bootstrap docs: List groups are a flexible and powerful
          // component for displaying a series of content. Modify and extend
          // them to support just about any content within.
          // `variant="flush"` removes outer borders and rounded corners from the list items.
          <ListGroup variant="flush">
            {cartItems.map((item) => (
              <ListGroup.Item key={item.id}>
                {/* a row inside the first column which contains other smaller columns */}
                <Row>
                  {/* First smaller column shows the product image */}
                  <Col md={2}>
                    <Image src={item.cover_url} alt={item.name} fluid rounded />
                  </Col>

                  {/* Second smaller column shows the name of the product. 
                  When the user clicks the name of the product, 
                  he/she is redirected to the product page.*/}
                  <Col md={3}>
                    <Link to={`/product/${item.id}`}>{item.name}</Link>
                  </Col>

                  {/* Third smaller column shows the price of the product. */}
                  <Col md={2}>${item.price}</Col>

                  {/* Forth smaller column allows to update the quantity of a product in the shopping cart. */}
                  <Col md={2}>
                    <Form.Control
                      as="select"
                      value={item.qty}
                      onChange={(e) =>
                        addToCartHandler(item, Number(e.target.value))
                      }
                      className={
                        theme === "dark"
                          ? "bg-dark text-light border-secondary"
                          : ""
                      }
                    >
                      {/* the destructured aray.keys() creates indexes 0, 1,...,countInStock - 1   */}
                      {/* the option values adds 1 to all of these indexes  */}
                      {/* meaning: It generates a list of selectable quantities from 1 up to the number of items
                          available in stock, so the user can choose how many units to buy. */}
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </Col>

                  {/* Fifth smaller column shows a button to remove a product from the shopping cart. */}
                  <Col md={2}>
                    <Button
                      type="button"
                      variant={theme}
                      onClick={() => removeFromCartHandler(item.id)}
                    >
                      Remove From Cart
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>

      {/* Second column shows 
      the total number items in the shopping cart, 
      the subtotal price
      and a button to proceed to checkout. */}
      <Col md={4}>
        <Card>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>
                Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)})
                items
              </h2>
              $
              {cartItems
                .reduce((acc, item) => acc + item.qty * item.price, 0)
                .toFixed(2)}
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type="button"
                className="btn-block"
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
                variant={theme}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
}

export default CartPage;
