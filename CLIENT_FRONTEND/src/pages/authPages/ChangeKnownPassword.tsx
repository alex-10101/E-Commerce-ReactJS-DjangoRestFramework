import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useState } from "react";
import FetchBaseError from "../../components/FetchBaseError";
import { useAppDispatch } from "../../redux-toolkit-config/hooks";
import { removeCredentials } from "../../redux-toolkit-config/slices/authSlice";
// import { apiSlice } from "../../redux toolkit config/services/apiSlice";
import { useChangeKnownPasswordMutation } from "../../redux-toolkit-config/api-services/authService";

/**
 *
 * @returns A page where a user can change its password if the user knows its password.
 *
 */
function ChangeKnownPassword() {
  const [changePassword, { error }] = useChangeKnownPasswordMutation();

  const dispatch = useAppDispatch();

  const [userInput, setUserInput] = useState({
    oldPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  /**
   * Handles changes to user passwords form inputs.
   *
   * This function updates the local `userInput` state whenever
   * the user types into an input field. Each input is identified by its
   * `name` attribute, which must match a key in the `userInput` state.
   *
   * The state update preserves all existing properties and updates only
   * the field that is currently being edited.
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    setUserInput({
      ...userInput,
      [e.target.name]: e.target.value,
    });
  }

  /**
   * Make a PUT request to change the password when the user clicks the "Change Password" button.
   * @param e
   */
  async function handleChangePassword(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();

    // Inside {}, key–value pairs must be provided, not expressions, so the below will NOT work, it will rise TypeScript errors:
    // await changePassword({
    //   userInput.oldPassword,
    //   userInput.newPassword,
    //   userInput.newPasswordConfirm,
    // }).unwrap();

    await changePassword({
      oldPassword: userInput.oldPassword,
      newPassword: userInput.newPassword,
      newPasswordConfirm: userInput.newPasswordConfirm,
    }).unwrap();
    dispatch(removeCredentials());
    // dispatch(apiSlice.util.resetApiState());
  }

  return (
    <Container className="d-flex align-items-center flex-column my-4">
      <h1>Change Password</h1>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Old Password</Form.Label>
          <Form.Control
            name="oldPassword"
            type="password"
            placeholder="Enter old password"
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            name="newPassword"
            type="password"
            placeholder="Enter  new  password"
            onChange={handleChange}
          />
          <Form.Text className="text-muted">
            Password must contain at least 8 characters and not be common!
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            name="newPasswordConfirm"
            type="password"
            placeholder="Confirm new password"
            onChange={handleChange}
          />
          <Form.Text className="text-muted">
            Password must contain at least 8 characters and not be common!
          </Form.Text>
        </Form.Group>

        {error && <FetchBaseError error={error} />}

        <Button variant="primary" type="submit" onClick={handleChangePassword}>
          Change Password
        </Button>
      </Form>
    </Container>
  );
}

export default ChangeKnownPassword;
