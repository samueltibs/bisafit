import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// CRITICAL: Check for password recovery token BEFORE React loads
// This ensures we redirect to /reset-password before any routing happens
(function checkPasswordRecovery() {
  const hash = window.location.hash;
  if (hash && hash.includes('type=recovery')) {
    // We have a password recovery token
    // Redirect to /reset-password if not already there
    if (!window.location.pathname.includes('/reset-password')) {
      console.log('[Auth] Password recovery detected, redirecting to /reset-password');
      window.location.href = '/reset-password' + hash;
      return; // Stop execution, page will reload
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
