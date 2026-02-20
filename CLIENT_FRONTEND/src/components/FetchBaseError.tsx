import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { SerializedError } from "@reduxjs/toolkit/react";

/**
 * Component which displays an error message from the server.
 * The component works when the Fetch API is used.
 * @param param0
 * @returns
 */
function FetchBaseError({
  error,
}: {
  error: FetchBaseQueryError | SerializedError | undefined;
}) {
  //  @ts-ignore
  const errorFromServer = error.data.detail;

  if (typeof errorFromServer === "string") {
    return <p style={{ color: "red" }}>{errorFromServer}</p>;
  }

  if (typeof errorFromServer === "object") {
    return Object.keys(errorFromServer).map((key, id) => (
      <p key={id} style={{ color: "red" }}>
        {errorFromServer[key].join(" ")}
      </p>
    ));
  }
}

export default FetchBaseError;
