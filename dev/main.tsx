import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Remy } from "../src";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Remy />
  </StrictMode>
);
