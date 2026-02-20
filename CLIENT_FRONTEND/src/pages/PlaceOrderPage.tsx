import { useAppSelector } from "../redux-toolkit-config/hooks";
import CheckoutSteps from "../components/CheckoutSteps";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import { Link, useNavigate } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { selectTheme } from "../redux-toolkit-config/slices/themeSlice";
import { useEffect } from "react";
import FetchBaseError from "../components/FetchBaseError";
import Loader from "../components/Loader";
import { useCreateOrderMutation } from "../redux-toolkit-config/api-services/orderService";

/**
 *
 * @returns A page, where the user can place an order.
 */
function PlaceOrderPage() {
  const navigate = useNavigate();
  const theme = useAppSelector(selectTheme);
  const cart = useAppSelector((state) => state.cart);
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  // If the user didn't enter shipping data, redirect him/her to the shipping page.
  // The data from useAppSelector loads only after the first render.
  // On the initial render, the userInfo is null or undefined.
  // When the data from the Redux store becomes available (or changes), the component re-renders.
  // To redirect the user to the shipping page, if there is no data coming from the Redux store,
  // this useEffect is needed.
  useEffect(() => {
    if (!cart.shippingAddress.address) {
      navigate("/shipping");
    } else if (!cart.paymentMethod) {
      navigate("/payment");
    }
  }, [cart.paymentMethod, cart.shippingAddress.address, navigate]);

  // Loop through all items in the shopping cart and calculate the price of all items.
  // Round the price to two decimal places.
  const itemsPrice = cart.cartItems
    .reduce((acc, item) => acc + item.price * item.qty, 0)
    .toFixed(2);

  // Calculate the shipping price.
  // If the price of all items exceeds $100, shipping is free, else it is $10.
  // Round the price to two decimal places.
  const shippingPrice = (Number(itemsPrice) > 100 ? 0 : 10).toFixed(2);

  // Calculate the tax price. Here the tax price is 8.2% of the price of all items.
  // Round the price to two decimal places.
  const taxPrice = (0.082 * Number(itemsPrice)).toFixed(2);

  // Calculate the total price of the order.
  // Round the price to two decimal places.
  const totalPrice = (
    Number(itemsPrice) +
    Number(shippingPrice) +
    Number(taxPrice)
  ).toFixed(2);

  /**
   * When the user clicks the "Place Order" button,
   * it triggers this function which:
   *
   * - prevents the default browser behaviour to refresh the page
   * - makes a request to the server to add a new order to the database
   * - dispatches/sends an action which clears all items from the global store
   * - redirects the user to the order page
   */
  async function placeOrder(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    const response = await createOrder({
      orderItems: cart.cartItems,
      shippingAddress: cart.shippingAddress,
      paymentMethod: cart.paymentMethod,
    }).unwrap();
    // dispatch(clearCartItems());
    navigate(`/order/${response.id}`);
  }

  if (error) {
    console.log(error);
  }

  return (
    <div>
      <CheckoutSteps
        step1="completed"
        step2="completed"
        step3="completed"
        step4="completed"
      />
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Shipping: </strong>
                {cart.shippingAddress.address},{cart.shippingAddress.city},
                {cart.shippingAddress.postalCode},{cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method </h2>
              <p>
                <strong>Method: </strong>
                {cart.paymentMethod}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items </h2>
              {cart.cartItems.length === 0 ? (
                <p color="blue">Your cart is empty</p>
              ) : (
                <ListGroup variant="flush">
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={2}>
                          <Image
                            src={item.cover_url}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>

                        <Col>
                          <Link to={`/product/${item.id}`}>{item.name}</Link>
                        </Col>

                        <Col md={4}>
                          {item.qty} X ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Item: </Col>
                  <Col>${itemsPrice}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Shipping: </Col>
                  <Col>${shippingPrice}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Tax: </Col>
                  <Col>${taxPrice}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Total: </Col>
                  <Col>${totalPrice}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Button
                  type="button"
                  className="btn-block"
                  variant={theme}
                  disabled={cart.cartItems.length === 0}
                  onClick={placeOrder}
                >
                  Place Order
                </Button>

                {isLoading && <Loader />}

                {error && <FetchBaseError error={error} />}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default PlaceOrderPage;
