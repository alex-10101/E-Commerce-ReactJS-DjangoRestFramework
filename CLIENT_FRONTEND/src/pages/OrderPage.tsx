import { useAppSelector } from "../redux-toolkit-config/hooks";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import { Link, useParams } from "react-router-dom";
import Card from "react-bootstrap/Card";
import FetchBaseError from "../components/FetchBaseError";
import Loader from "../components/Loader";
import Button from "react-bootstrap/Button";
import { useEffect, useState } from "react";
import {
  useCreateStripeCheckoutSessionMutation,
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  useMarkOrderAsPaidMutation,
} from "../redux-toolkit-config/api-services/orderService";

/**
 *
 * @returns A page, where the user can see the status of his/her order.
 */
function OrderPage() {
  const params = useParams();
  const orderId = Number(params.id);

  const user = useAppSelector((state) => state.auth.user);

  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);

  const [createCheckoutSession, { isLoading: loadingCheckout }] =
    useCreateStripeCheckoutSessionMutation();

  const [
    deliverOrder,
    { error: deliverOrderError, isLoading: deliverOrderLoading },
  ] = useDeliverOrderMutation();

  const [
    markOrderAsPaid,
    { error: markOrderAsPaidError, isLoading: markOrderAsPaidLoading },
  ] = useMarkOrderAsPaidMutation();

  /**
   * When the user clicks the Pay with Stripe button, it triggers this function which
   *
   * 1) Calls the backend to create a Stripe Checkout Session for the current order
   *    (the server computes all prices and returns a Stripe-hosted checkout URL).
   *
   * 2) Performs a full-page redirect to Stripe Checkout using `window.location.assign`,
   *    leaving the SPA and handing control to Stripe.
   *
   * After payment, Stripe redirects the user back to the client application to
   * `success_url` or `cancel_url`, which are configured on the backend.
   */
  async function handleStripeCheckout() {
    const res = await createCheckoutSession(orderId).unwrap();
    window.location.assign(res.url);
  }

  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      setMessage(
        "Order canceled -- continue to shop around and checkout when you're ready.",
      );
    }
  }, []);

  /**
   * When the admin clicks the "Mark As Delivered", it triggers this function,
   * which makes a PUT request to the server to update the order and set it to paid.
   * @param orderId
   */
  async function handleDeliverOrder(orderId: number) {
    await deliverOrder(orderId).unwrap();
  }

  /**
   * When the admin clicks the "Mark As Delivered", it triggers this function,
   * which makes a PUT request to the server to update the order and set it to paid.
   * @param orderId
   */
  async function handleMarkOrderAsPaid(orderId: number) {
    await markOrderAsPaid(orderId).unwrap();
  }

  return isLoading || deliverOrderLoading || markOrderAsPaidLoading ? (
    <Loader />
  ) : error ? (
    <FetchBaseError error={error} />
  ) : (
    order && (
      <div>
        <Row>
          <h1>Order: {order?.id}</h1>
          <Col md={8}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Shipping</h2>
                <p>
                  <strong>Name: </strong>
                  {order?.user.username}
                </p>
                <p>
                  <strong>Email: </strong>
                  {order?.user.email}
                </p>

                <p>
                  <strong>Shipping: </strong>
                  {order?.shippingAddress.address},{order?.shippingAddress.city}
                  ,{order?.shippingAddress.postalCode},
                  {order?.shippingAddress.country}
                </p>

                {order?.isDelivered ? (
                  <p className="text-success">
                    Delivered on {order.delveredAt}
                  </p>
                ) : (
                  <p className="text-warning">Not delivered!</p>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Payment Info </h2>
                <p>
                  <strong>Method: </strong>
                  {order?.paymentMethod}
                </p>
                {order?.isPaid ? (
                  <p className="text-success">Paid on {order.paidAt}</p>
                ) : (
                  !user?.is_staff && (
                    <>
                      <Button
                        onClick={handleStripeCheckout}
                        disabled={loadingCheckout}
                      >
                        {loadingCheckout ? "Redirecting..." : "Pay with Stripe"}
                      </Button>

                      {message && <p>{message}</p>}
                    </>
                  )
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Order Items </h2>
                {order?.orderItems.length === 0 ? (
                  <p color="blue">Your order is empty</p>
                ) : (
                  <ListGroup variant="flush">
                    {order?.orderItems.map((item, index) => (
                      <ListGroup.Item key={index}>
                        <Row>
                          <Col md={2}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fluid
                              rounded
                            />
                          </Col>

                          <Col>
                            <Link to={`/product/${item.product}`}>
                              {item.name}
                            </Link>
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
                    {/* calculate the total price of all items in the order */}
                    <Col>Item: </Col>
                    <Col>
                      $
                      {order?.orderItems
                        .reduce((acc, item) => acc + item.price * item.qty, 0)
                        .toFixed(2)}
                    </Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Shipping: </Col>
                    <Col>${order?.shippingPrice}</Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Tax: </Col>
                    <Col>${order?.taxPrice}</Col>
                  </Row>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row>
                    <Col>Total: </Col>
                    <Col>${order?.totalPrice}</Col>
                  </Row>
                </ListGroup.Item>
              </ListGroup>

              {user && user.is_staff && !order.isPaid && (
                <ListGroup>
                  <Button
                    type="button"
                    className="btn-block"
                    onClick={() => handleMarkOrderAsPaid(order.id)}
                  >
                    Mark As Paid
                  </Button>
                  {markOrderAsPaidError && (
                    <FetchBaseError error={markOrderAsPaidError} />
                  )}
                </ListGroup>
              )}

              {user &&
                user.is_staff &&
                // order.isPaid &&
                !order.isDelivered && (
                  <ListGroup>
                    <Button
                      type="button"
                      className="btn-block"
                      onClick={() => handleDeliverOrder(order.id)}
                    >
                      Mark As Delivered
                    </Button>
                    {deliverOrderError && (
                      <FetchBaseError error={deliverOrderError} />
                    )}
                  </ListGroup>
                )}
            </Card>
          </Col>
        </Row>
      </div>
    )
  );
}

export default OrderPage;
