import React, { useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import FetchBaseError from "../../components/FetchBaseError";
import { useRequestChangeForgottenPasswordMutation } from "../../redux-toolkit-config/api-services/authService";
import Loader from "../../components/Loader";

/**
 *
 * @returns A page, where the user can enter its email address in order to receive an email to reset the forgotten password.
 */
function RequestChangeForgottenPassword() {
  const [email, setEmail] = useState("");
  const [requestPasswordReset, { data, error, isLoading }] =
    useRequestChangeForgottenPasswordMutation();

  /**
   * Make a POST request to recover the password then the user clicks the  "Reset Forgotten Password" button.
   */
  async function handleRecoverPassword(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    await requestPasswordReset({ email }).unwrap();
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Container className="my-4">
      <h1>Reset Forgotten Password</h1>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter the email with which you registered."
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        {data && <p style={{ color: "green", marginTop: "3px" }}>{data}</p>}

        {/**If an error occured, show the error message. The error message comes from the server. */}
        {error && <FetchBaseError error={error} />}

        <Button variant="primary" type="submit" onClick={handleRecoverPassword}>
          Reset Forgotten Password
        </Button>
      </Form>
    </Container>
  );
}

export default RequestChangeForgottenPassword;
