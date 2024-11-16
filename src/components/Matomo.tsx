import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { GraphContext } from "../lib/context";

const matomoUrl: string | undefined = process.env.REACT_APP_MATOMO_URL;
const matomoSiteId: string | undefined = process.env.REACT_APP_MATOMO_SITE_ID;

const Matomo: React.FC = () => {
  const location = useLocation();
  const { navState } = useContext(GraphContext);

  return (
    <>
      {matomoUrl && matomoSiteId && (
        <img
          referrerPolicy="no-referrer-when-downgrade"
          src={`${matomoUrl}/matomo.php?idsite=${matomoSiteId}&url=${window.location.origin}${
            location.pathname
          }&rec=1&_cvar={"1":["graph", "${navState.url || "local"}"]}`}
          style={{ border: 0 }}
          alt=""
        />
      )}
    </>
  );
};

export default Matomo;
