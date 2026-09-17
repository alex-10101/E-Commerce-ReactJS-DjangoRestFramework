import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { Link, useNavigate } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import {
  useAppDispatch,
  useAppSelector,
} from "../../redux-toolkit-config/hooks";
import { useLoginUserMutation } from "../../redux-toolkit-config/api-services/authService";
import { setCredentials } from "../../redux-toolkit-config/slices/authSlice";

/**
 *
 * @returns a page where a user can login with email and password
 */
function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { error }] = useLoginUserMutation();
  const [formIsValidated, setFormIsValidated] = useState(false);

  /**
   * Make a POST request to log in when the user clicks the "Login" button.
   * @param e
   */
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // validated = false --> client validation messages are NOT shown
    // validated = true --> client validation messages are shown
    setFormIsValidated(true);

    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      return;
    }

    // Client validation passed, so hide the validation feedback again.
    // (reset form validation status)
    setFormIsValidated(false);

    const loginData = await login({ email, password }).unwrap();
    dispatch(setCredentials({ ...loginData }));
    navigate("/");
  }

  const user = useAppSelector((state) => state.auth.user);

  // check when the component mounts if the user is authenticated. If yes redirect him to the home page.
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  return (
    // Center the container (which contains the Form and the h1 tag) horizontally and vertically,
    // and align items in a "column" direction (from top to bottom).
    <Container className="d-flex min-vh-100 justify-content-center align-items-center flex-column">
      <h1>Login</h1>
      <Form noValidate validated={formIsValidated} onSubmit={handleLogin}>
        <Form.Group className="mb-3 my-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            required
            type="text"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Email is required.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            required
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            Password is required.
          </Form.Control.Feedback>

          <Form.Text className="text-muted">
            Did not register yet? Navigate to{" "}
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Register Page
            </Link>
            . Forgot password? Click{" "}
            <Link
              to="/requestChangeForgottenPassword"
              style={{
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              here.
            </Link>
          </Form.Text>
        </Form.Group>

        {error && <FetchBaseError error={error} />}

        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </Container>
  );
}

export default Login;
