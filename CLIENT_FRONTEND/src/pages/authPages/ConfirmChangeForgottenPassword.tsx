import React, { useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import FetchBaseError from "../../components/FetchBaseError";
import { Link, useParams } from "react-router-dom";
import { useConfirmChangeForgottenPasswordMutation } from "../../redux-toolkit-config/api-services/authService";

/**
 *
 * @returns Form to reset a forgotten password. The user is redirected to this page from the email it received.
 */
function ConfirmChangeForgottenPassword() {
  const [resetPassword, { error, data }] =
    useConfirmChangeForgottenPasswordMutation();

  const [userInput, setUserInput] = useState({
    newPassword: "",
    newPasswordConfirm: "",
  });

  const { uid, token } = useParams();

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
    if (uid && token) {
      await resetPassword({
        uid: uid,
        token: token,
        newPassword: userInput.newPassword,
        newPasswordConfirm: userInput.newPasswordConfirm,
      }).unwrap();
    }
  }

  return (
    <Container className="d-flex align-items-center flex-column my-4">
      <h1>Change Password</h1>
      <Form>
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

      {data && (
        <p>
          {data}. Go to <Link to="/login">Login Page.</Link>
        </p>
      )}
    </Container>
  );
}

export default ConfirmChangeForgottenPassword;
