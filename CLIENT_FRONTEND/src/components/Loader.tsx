import Spinner from "react-bootstrap/Spinner";

/**
 *
 * @returns A component which shows a spinner during the time data is being retrieved from the server.
 */
function Loader() {
  return (
    <Spinner
      animation="border"
      role="status"
      style={{
        height: "100px",
        width: "100px",
        margin: "auto",
        display: "block",
      }}
    ></Spinner>
  );
}

export default Loader;
