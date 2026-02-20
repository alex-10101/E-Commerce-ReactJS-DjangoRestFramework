import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import { useActivateAccoumtMutation } from "../../redux-toolkit-config/api-services/authService";

/**
 *
 * @returns A page from which the user is redirected after activating the account. The user is redirected to this page from the email it received.
 */
function ActivateAccount() {
  const { uid, token } = useParams();

  const [requestAccountActivation, { error, data }] =
    useActivateAccoumtMutation();

  useEffect(() => {
    async function activateAccount() {
      if (uid && token) {
        await requestAccountActivation({
          uid,
          token,
        }).unwrap();
      }
    }
    activateAccount();
  }, [uid, token]);

  return (
    <div>
      <h2>Account Activation</h2>

      {data && (
        <p>
          {data}. Go to <Link to="/login">Login Page.</Link>
        </p>
      )}

      {error && <FetchBaseError error={error} />}
    </div>
  );
}

export default ActivateAccount;
