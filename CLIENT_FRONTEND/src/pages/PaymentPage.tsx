import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux-toolkit-config/hooks";
import { useEffect, useState } from "react";
import { savePaymentMethod } from "../redux-toolkit-config/slices/cartSlice";
import FormContainer from "../components/FormContainer";
import CheckoutSteps from "../components/CheckoutSteps";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import { selectTheme } from "../redux-toolkit-config/slices/themeSlice";

/**
 *
 * @returns A page, where the user can process payments.
 */
function PaymentPage() {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const theme = useAppSelector(selectTheme);

  // If the user didn't enter shipping data, redirect him/her to the shipping page.
  // The data from useAppSelector loads only after the first render.
  // On the initial render, the userInfo is null or undefined.
  // When the data from the Redux store becomes available (or changes), the component re-renders.
  // To redirect the user to the shipping page, if there is no data coming from the Redux store,
  // this useEffect is needed.
  useEffect(() => {
    if (
      !(
        cart.shippingAddress.address &&
        cart.shippingAddress.city &&
        cart.shippingAddress.country &&
        cart.shippingAddress.postalCode
      )
    ) {
      navigate("/shipping");
    }
  }, [
    cart.shippingAddress.address,
    cart.shippingAddress.city,
    cart.shippingAddress.country,
    cart.shippingAddress.postalCode,
  ]);

  /**
   * When the user clicks the "Continue" button to submit the form,
   * it triggers this function which:
   *
   * - prevents the default browser behaviour to refresh the page
   * - sends / dispatches an action, which saves the payment method in the global state
   * - redirects the user to the placeorder page
   *
   * @param e
   */
  function handleSubmit(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate("/placeorder");
  }

  return (
    <FormContainer>
      <CheckoutSteps
        step1={"completed"}
        step2={"completed"}
        step3={"completed"}
        step4={""}
      />

      <Form>
        <Form.Group>
          <Form.Label as="legend">Select Method</Form.Label>
          <Col>
            <Form.Check
              type="radio"
              label="Stripe"
              id="paypal"
              name="paymentMethod"
              checked
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
          </Col>
        </Form.Group>

        <Button type="submit" variant={theme} onClick={handleSubmit}>
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
}

export default PaymentPage;
