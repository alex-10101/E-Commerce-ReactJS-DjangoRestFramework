import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";

/**
 *
 * @param param0
 * @returns A component which shows the steps with links in a multi-step form.
 */
function CheckoutSteps({
  step1,
  step2,
  step3,
  step4,
}: {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
}) {
  return (
    <Nav className="justify-content-center mb-4">
      <Nav.Item>
        {step1 ? (
          <Nav.Link as={Link} to="/login">
            1. Login
          </Nav.Link>
        ) : (
          <Nav.Link disabled>1. Login</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step2 ? (
          <Nav.Link as={Link} to="/shipping">
            2. Shipping
          </Nav.Link>
        ) : (
          <Nav.Link disabled>2. Shipping</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step3 ? (
          <Nav.Link as={Link} to="/payment">
            3. Payment
          </Nav.Link>
        ) : (
          <Nav.Link disabled>3. Payment</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step4 ? (
          <Nav.Link as={Link} to="/placeorder">
            4. Place Order
          </Nav.Link>
        ) : (
          <Nav.Link disabled>4. Place Order</Nav.Link>
        )}
      </Nav.Item>
    </Nav>
  );
}

export default CheckoutSteps;
