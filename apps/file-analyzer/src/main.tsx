import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FileInfoProvider } from "./file-info/file-info-provider";
import "./index.css"; // <-- Bu satırın burada olduğundan emin olun!

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FileInfoProvider>
      <App />
    </FileInfoProvider>
  </React.StrictMode>,
);
