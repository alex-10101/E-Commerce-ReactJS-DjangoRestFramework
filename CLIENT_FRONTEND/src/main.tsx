import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import "./index.css";
import "./bootstrap.min.css";
// import "bootstrap/dist/css/bootstrap.min.css";

import { store } from "./redux-toolkit-config/store";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
