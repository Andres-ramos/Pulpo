import React from "react";
import { createRoot } from "react-dom/client";

import { AppContext } from "./lib/context";
import "./styles/index.scss";
import Root from "./pages/Root";
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppContext.Provider value={{ portalTarget: document.getElementById("portal-target") as HTMLDivElement }}>
        <Root />
      </AppContext.Provider>
    </BrowserRouter>
    
  </React.StrictMode>,
);
