import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import Loader from "../../components/Loader";
import {
  useGetUserDetailsQuery,
  useUpdateUserMutation,
} from "../../redux-toolkit-config/api-services/authService";
import FormContainer from "../../components/FormContainer";

/**
 *
 * @returns A page, where the admin can edit the account of an user.
 */
function UserEditPage() {
  const [_username, setUsername] = useState("");
  const [_email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = Number(useParams().id);

  const { data: user, isLoading, error } = useGetUserDetailsQuery(userId);

  const [updateUser, { isLoading: loadingUpdate, error: errorUpdate }] =
    useUpdateUserMutation();

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setIsAdmin(user.is_staff);
    }
  }, [user]);

  /**
   * When the admin clicks the Update button, it triggers this function
   * which makes a POST request to the server to update the account of a user
   * (for example grant admin permissions).
   * @param e
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log(isAdmin);
    await updateUser({
      userId,
      is_staff: isAdmin,
    }).unwrap();

    if (!errorUpdate) {
      navigate("/admin/userlist");
    }
  }

  return (
    <div>
      <Link to="/admin/userlist">Go Back</Link>
      <FormContainer>
        <h1>Edit User</h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <FetchBaseError error={errorUpdate} />}

        {isLoading ? (
          <Loader />
        ) : error ? (
          <FetchBaseError error={error} />
        ) : (
          user && (
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="isadmin">
                <Form.Check
                  type="checkbox"
                  label="Is Admin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                ></Form.Check>
              </Form.Group>

              <Button type="submit" variant="primary">
                Update
              </Button>
            </Form>
          )
        )}
      </FormContainer>
    </div>
  );
}

export default UserEditPage;
