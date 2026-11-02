import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppLayout } from "./main-form";
import "./index.css"; // <-- Bu satırın burada olduğundan emin olun!

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppLayout />
  </React.StrictMode>,
);
