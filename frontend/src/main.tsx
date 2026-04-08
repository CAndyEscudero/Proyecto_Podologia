import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./app/router";
import { FrontendErrorReporter } from "./shared/observability/frontend-error-reporter";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontro el nodo root para montar la aplicacion.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FrontendErrorReporter />
    <RouterProvider router={router} />
    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
  </React.StrictMode>
);
