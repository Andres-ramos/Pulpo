
import Connection from "./Connection";
import Node from "./Node";
import { GraphContext } from "../lib/context";
import React, { FC, useContext } from "react";
import cx from "classnames";


export const ConnectionList = ({visibleNeighbors, node}: any) => {
  const {
    data: { graph },
  } = useContext(GraphContext);

  const textMap = {
    "officer": "Oficial",
    "donation": "Donación",
    "presidente": "Presidente",
    "vice_presidente": "Vice Presidente",
    "agent": "Agente Residente",
    "incorporator": "Incorporador",
    "contract": "Contrato",
    "CFO": "CFO",
    "tesorero": "Tesorero"
    
  }
  return (
    <ul className="list-unstyled">
      {visibleNeighbors.map((neighbor:any) => (
        <div className="card connection-card">
          <li key={neighbor} className="d-flex flex-row">
              <div className="corp-card">
                {/* Hacer esto un componente */}
                <div
                  className={cx("me-2 flex-shrink-0")}
                  style={{
                    background: graph.getNodeAttributes(neighbor).color,
                    height: "50px",
                    width: "50px",
                    borderRadius: "50%"
                  }}
                />
                <div>
                  <Node link node={neighbor} className="text-ellipsis" attributes={graph.getNodeAttributes(neighbor)}/>
                  <h5 > {textMap[graph.getEdgeAttributes(graph.edges(neighbor, node)).attributes.label]} </h5>
                  <h6>
                    {textMap[graph.getEdgeAttributes(graph.edges(neighbor, node)).attributes.sub_type]}
                  </h6>
                </div>
               
              </div>
            
          </li>
        </div>

      ))}
    </ul>
  )
}
