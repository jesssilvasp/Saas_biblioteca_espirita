import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LibraryProvider } from "./hooks/useLibrary";
import { AppRoutes } from "./routes/QwenRoutes";
import "./qwen/styles.css";

if (!window.location.hash)
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#/login`,
  );

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LibraryProvider>
      <AppRoutes />
    </LibraryProvider>
  </StrictMode>,
);
