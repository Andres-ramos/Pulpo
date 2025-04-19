import cx from "classnames";
import React, { FC, useEffect, useState } from "react";
import { AiOutlineCloud } from "react-icons/ai";
import { RiComputerLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router";

// import Footer from "../components/Footer";
import { SAMPLE_DATASET_URI } from "../../lib/consts";
import { getErrorMessage } from "../../lib/errors";
import { useNotifications } from "../../lib/notifications";
import Header from "./Header"

const HomeView: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotifications();
  const error = ((location.state as { error?: unknown } | undefined)?.error || "") + "";
  const [state, setState] = useState<
    { type: "hidden" } | { type: "choice" } | { type: "url"; input: string } | { type: "local"; input: File | null }
  >({ type: "hidden" });

  useEffect(() => {
    const id = setTimeout(() => setState({ type: "choice" }), 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (error)
      notify({
        message: getErrorMessage(error),
        type: "error",
      });
  }, [error, notify]);

  return (
    <main className="home-view ">
      <Header/>

      <div className="title-block">
        <h1 className="mb-4">
          <span className="position-relative font-weight-bold text-dark">
            Pulpo-o{" "}
            <small className="position-absolute top-0 start-100 translate-middle badge bg-success fs-6 text-dark">
              alpha
            </small>
          </span>
        </h1>
        <h2 className="h4 text-center">
          <strong> Definición: </strong> Un <i> <u> pulpo </u></i> es una criatura con tentáculos en el sector <i> privado </i> y en las agencias <i> públicas </i> que <u>fiscalizan</u> ese sector. 
        </h2>
        <div>
          <div className={cx("gexf-form", "text-center", "mt-4", state.type === "hidden" && "opacity-0")}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/graph/?r=e&l=1`);
                }}
              >
                <button type="submit" className="btn btn-lg viz-button mt-2 text-dark font-weight-bold">
                 Visualizar
                </button>
              </form>
            
          
          </div>
        </div>
      </div>
{/* 
      <div className="footer p-2">
        <hr className="mb-2" />
        <Footer />
      </div> */}
    </main>
  );
};

export default HomeView;
