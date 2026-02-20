import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/**
 * Function to get a cookie by its name.
 * @param name The name of the cookie, here "csrftoken".
 * @returns The value of the csrf token.
 */
export function getCSRFCookie(name: string) {
  let cookieValue: string | null = null;

  // If there are cookies saved in the browser
  if (document.cookie && document.cookie !== "") {
    // Get all cookies (key=value pairs, or cookie_name=cookie_value pairs).
    // The cookies are separated by semicolons.
    let cookies = document.cookie.split(";");

    // Loop through all cookies
    for (let i = 0; i < cookies.length; i++) {
      // Read a cookie.
      // `.trim()` removes the leading and trailing white space and line terminator characters from a string.
      let cookie = cookies[i].trim();

      // Get the cookie, for which the name is the one passed as parameter to this function.
      // Verify the name of the cookie being read matches the name passed as parameter to this function,
      // and that the name of the cookie is followed by a "=".
      if (cookie.substring(0, name.length + 1) === name + "=") {
        // Decode the value of the cookie (the characters after "=").
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));

        // After the wanted cookie is found, stop looping over the other cookies if it not necessary.
        break;
      }
    }
  }

  // Return the value of the cookie.
  return cookieValue;
}

/**
 * Function which checks if an error is a csrf error.
 * This function may be helpful do distinguish between the errors,
 * in the case the server returns multiple errors, all with 403 error codes..
 * @param error
 * @returns
 */
export function isCsrfError(error: FetchBaseQueryError): boolean {
  const data = error.data;
  if (!data) {
    return false;
  }

  if (typeof data === "string") {
    return data.toLowerCase().includes("csrf");
  }

  if (typeof data === "object") {
    try {
      return JSON.stringify(data).toLowerCase().includes("csrf");
    } catch {
      return false;
    }
  }

  return false;
}
