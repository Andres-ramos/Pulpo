
import Connection from "./Connection";
import Node from "./Node";
import { GraphContext } from "../lib/context";
import React, { FC, useContext } from "react";
import cx from "classnames";


export const ConnectionList = ({visibleNeighbors, node}: any) => {
  const {
    data: { graph },
  } = useContext(GraphContext);

  return (
    <ul className="list-unstyled">
      {visibleNeighbors.map((neighbor:any) => (
        <div className="card connection-card">
          <li key={neighbor} className="d-flex flex-row">
              <div className="card-body">
                <div
                  className={cx("me-2 flex-shrink-0", "circle")}
                  style={{
                    background: "red",
                    height: "40px",
                    width: "40px",
                    borderRadius: "50%"
                  }}
                />
                <Node link node={neighbor} className="text-ellipsis" attributes={graph.getNodeAttributes(neighbor)}/>
                {/* Una especie de if donde se determina cuales valores poner */}
                <h2 > {graph.getEdgeAttributes(graph.edges(neighbor, node)).label} </h2>
              </div>
            
          </li>
        </div>

      ))}
    </ul>
  )
}
