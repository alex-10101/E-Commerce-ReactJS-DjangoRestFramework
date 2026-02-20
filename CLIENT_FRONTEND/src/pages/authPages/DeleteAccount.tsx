import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import FetchBaseError from "../../components/FetchBaseError";
import { useDeleteUserMutation } from "../../redux-toolkit-config/api-services/authService";
import { useAppDispatch } from "../../redux-toolkit-config/hooks";
// import { apiSlice } from "../../redux toolkit config/services/apiSlice";
import { removeCredentials } from "../../redux-toolkit-config/slices/authSlice";

/**
 *
 * @returns A page where the user can delete his/her account
 */
function DeleteAccount() {
  const [password, setPassword] = useState("");
  const [deleteAccount, { error }] = useDeleteUserMutation();
  const dispatch = useAppDispatch();

  /**
   * Make a DELETE request to delete the account when the user clicks the "Delete Account" button.
   */
  async function handleDeleteAccount(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    await deleteAccount({ password }).unwrap();
    dispatch(removeCredentials());
    // dispatch(apiSlice.util.resetApiState());
  }

  return (
    <Container className="my-4">
      <h1>Delete Account (action is permanent!)</h1>
      <Form>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        {/**If an error occured, show the error message. The error message comes from the server. */}
        {error && <FetchBaseError error={error} />}

        <Button variant="primary" type="submit" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </Form>
    </Container>
  );
}

export default DeleteAccount;
