import React, { FC, useContext} from "react";
import Linkify from "react-linkify";
import { BiRadioCircleMarked } from "react-icons/bi";
import { map, startCase } from "lodash";
import { ANIMATION_DURATION, DEFAULT_LINKIFY_PROPS } from "../../lib/consts";
import { GraphContext } from "../../lib/context";
import { FaTimes } from "react-icons/fa";
import { Coordinates } from "sigma/types";
import cx from "classnames";
import {NodeInformation} from "./nodeInformation";

export const Profile = ({filteredAttributes, node, isHidden, currentAttributes}:any) => {
  const {
    navState,
    setNavState,
    data: { graph },
    sigma,
    computedData: { filteredNodes },
  } = useContext(GraphContext);

  const nodeType = currentAttributes.attributes.value;
  const cleanValue = {
    "individual": "Individuo",
    "corporation": "Corporación",
    "government_entity": "Entidad Gubernamental",
    "Junta de directores": "Junta de Directores",
    "position": "Posición",
    "politician": "Político",
    "Secretario": "Secretario"
  }
  
  return (
    <div>
      <h1 className="fs-4 mt-4">
        <div className="node-profile">
            <span className={cx("me-2", isHidden ? "circle" : "disc")} style={{ background: currentAttributes.color, fontSize:80, borderColor:'black'}} />
            <h2 className="text">
                <div className="profile-text">
                <h2 className="profile-name"> {currentAttributes.label} </h2>
                <p className="profile-type"> {cleanValue[currentAttributes.attributes.value]}</p>
                </div>
            </h2>
        
        </div>
        {isHidden ? (
        <>
            {" "}
            <small className="text-muted">(currently filtered out)</small>
        </>
        ) : null}
      </h1>
      <NodeInformation nodeType={nodeType} filteredAttributes={filteredAttributes}/>
      <div className="button-menu">
        <button
            className="nav-button btn btn-outline-dark mt-1 me-2"
            onClick={() => setNavState({ ...navState, selectedNode: undefined })}
        >
            <FaTimes /> Deselecionar
        </button>
        <button
            className="nav-button btn btn-outline-dark mt-1"
            onClick={() => {
            if (!sigma) return;
            const nodePosition = sigma.getNodeDisplayData(node) as Coordinates;
            sigma.getCamera().animate(
                { ...nodePosition, ratio: 0.3 },
                {
                duration: ANIMATION_DURATION,
                },
            );
            }}
        >
            <BiRadioCircleMarked /> Mostrar en grafo
        </button>
      </div>
    </div>
    
  )

}