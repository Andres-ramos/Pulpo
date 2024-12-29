import React, { ChangeEvent, FC, useContext, useMemo, useRef, useState } from "react";
import { BsShare } from "react-icons/bs";
import { FiCopy } from "react-icons/fi";

import Modal from "../../components/Modal";
import { GraphContext } from "../../lib/context";
import { Data } from "../../lib/data";
import { cleanNavState, navStateToQueryURL } from "../../lib/navState";
import { useNotifications } from "../../lib/notifications";

const DisclaimerModal: FC<{ close: () => void }> = ({ close }) => {
  const { notify } = useNotifications();
  const { data, navState } = useContext(GraphContext);

  return (
    <Modal
      className="modal-lg"
      title={
        <>
           Aviso
        </>
      }
      onClose={close}
    >
      
        <div className="mb-3">           
         <p> Los datos utilizados para la construcción de este grafo provienen de fuentes públicas de información fuera de nuestro control, por lo que no nos hacemos responsables de cualquier información errónea o imprecisa que pueda surgir de esta herramienta. </p>
        </div>

        <button type="button" className="btn mt-1 ms-2 bg-primary" onClick={close}>
          Entiendo
        </button>
    </Modal>
  );
};

export default DisclaimerModal;
