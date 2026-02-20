import { useEffect, useState } from "react";
import FormContainer from "../components/FormContainer";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useAppDispatch, useAppSelector } from "../redux-toolkit-config/hooks";
import { saveShippingAddress } from "../redux-toolkit-config/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/CheckoutSteps";
import { selectTheme } from "../redux-toolkit-config/slices/themeSlice";

/**
 *
 * @returns A page, where the user can eneter his/her shipping address.
 */
function ShippingPage() {
  const [shippingData, setShippingData] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  /**
   * Handles changes to shipping data form inputs.
   *
   * This function updates the local `shippingData` state whenever
   * the user types into an input field. Each input is identified by its
   * `name` attribute, which must match a key in the `shippingData` state.
   *
   * The state update preserves all existing properties and updates only
   * the field that is currently being edited.
   */
  function handleChangeShippinhData(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    setShippingData((previousShippingData) => ({
      ...previousShippingData,
      [e.target.name]: e.target.value,
    }));
  }

  const shippingDataState = useAppSelector(
    (state) => state.cart.shippingAddress,
  );

  const theme = useAppSelector(selectTheme);

  // The data from useAppSelector loads only after the first render.
  // On the initial render, the userInfo is null or undefined.
  // When the data from the Redux store becomes available (or changes), the component re-renders.
  // To fill the values of the input fields with the data from the Redux store,
  // this useEffect is needed.
  // This is useful when the user comes back to this page after filling out the form:
  // in that case, the input fields should we prefilled with the data coming from the global store.
  useEffect(() => {
    setShippingData({
      address: shippingDataState.address,
      city: shippingDataState.city,
      country: shippingDataState.country,
      postalCode: shippingDataState.postalCode,
    });
  }, [
    shippingDataState.address,
    shippingDataState.city,
    shippingDataState.country,
    shippingDataState.postalCode,
  ]);

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  /**
   * When the user clicks the "Continue" button to submit the form,
   * it triggers this method which:
   *
   * - prevents the default browser behaviour to refresh the page
   * - sends/dispatches an action which saves the shipping address in the global store
   * - redirects the user to the payment page
   *
   *  @param e
   */
  function handleSubmitShippingData(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    dispatch(
      saveShippingAddress({
        address: shippingData.address,
        city: shippingData.city,
        postalCode: shippingData.postalCode,
        country: shippingData.country,
      }),
    );
    navigate("/payment");
  }

  return (
    <FormContainer>
      <CheckoutSteps
        step1={"completed"}
        step2={"completed"}
        step3={""}
        step4={""}
      />
      <h1>Shipping</h1>
      <Form>
        <Form.Group controlId="address">
          <Form.Label>Address</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Enter address"
            name="address"
            value={shippingData.address}
            onChange={handleChangeShippinhData}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId="city">
          <Form.Label>City</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Enter city"
            name="city"
            value={shippingData.city}
            onChange={handleChangeShippinhData}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId="postalCode">
          <Form.Label>Postal Code</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Enter postal code"
            name="postalCode"
            value={shippingData.postalCode}
            onChange={handleChangeShippinhData}
          ></Form.Control>
        </Form.Group>
        <Form.Group controlId="country">
          <Form.Label>Country</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Enter country"
            name="country"
            value={shippingData.country}
            onChange={handleChangeShippinhData}
          ></Form.Control>
        </Form.Group>

        <Button
          type="submit"
          variant={theme}
          onClick={handleSubmitShippingData}
        >
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
}

export default ShippingPage;
