import cx from "classnames";
import { map, mapKeys, omitBy, startCase, uniq } from "lodash";
import React, { FC, useContext } from "react";
import { BiRadioCircleMarked } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import Linkify from "react-linkify";
import { Coordinates } from "sigma/types";

import Connection from "../components/Connection";
import Node from "../components/Node";
import { ANIMATION_DURATION, DEFAULT_LINKIFY_PROPS, isHiddenRetinaField, removeRetinaPrefix } from "../lib/consts";
import { GraphContext } from "../lib/context";
import { NodeData } from "../lib/data";

import {ConnectionList} from "../components/ConnectionList"

const HIDDEN_KEYS = new Set(["x", "y", "z", "size", "label", "color"]);

const SelectedNodePanel: FC<{ node: string; data: NodeData }> = ({ node, data: { attributes } }) => {
  const {
    navState,
    setNavState,
    data: { graph },
    sigma,
    computedData: { filteredNodes },
  } = useContext(GraphContext);

  if (!attributes) return null;

  const currentAttributes = graph.getNodeAttributes(node);
  const filteredAttributes = mapKeys(
    omitBy(attributes, (_, key) => isHiddenRetinaField(key) || HIDDEN_KEYS.has(key)),
    (_, key) => removeRetinaPrefix(key),
  );
  const visibleNeighbors: string[] = [];
  const hiddenNeighbors: string[] = [];
  uniq(graph.neighbors(node)).forEach((n) => {
    if (filteredNodes && !filteredNodes.has(n)) hiddenNeighbors.push(n);
    else visibleNeighbors.push(n);
  });

  const isHidden = filteredNodes && !filteredNodes.has(node);

  return (
    <div className="selected-nodes-block block">
      <h1 className="fs-4 mt-4">
        {/* How do you make the circle bigger? */}
        <div className="node-profile">
          <span className={cx("me-2", isHidden ? "circle" : "disc")} style={{ background: currentAttributes.color, fontSize:80, borderColor:'black'}} />
          <h2 className="text">
            <div className="profile-text">
              <h2 className="profile-name"> {currentAttributes.label} </h2>
              <p className="profile-type"> {currentAttributes.attributes.value}</p>
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

      <br />
      {/* This should be rendered conditionally */}
      {map(filteredAttributes, (value, key) => (
        <h2 key={key} className="fs-5 ellipsis">
          <small className="text-muted">{startCase(key)}:</small>{" "}
          <span title={value}>
            {typeof value === "number" ? value.toLocaleString() : <Linkify {...DEFAULT_LINKIFY_PROPS}>{value}</Linkify>}
          </span>
        </h2>
      ))}

      {/* Make this into a component */}
      <div>
        <button
          className="btn btn-outline-dark mt-1 me-2"
          onClick={() => setNavState({ ...navState, selectedNode: undefined })}
        >
          <FaTimes /> Unselect
        </button>
        <button
          className="btn btn-outline-dark mt-1"
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
          <BiRadioCircleMarked /> Show on graph
        </button>
      </div>

      <br />      
      <hr />

      {!(visibleNeighbors.length + hiddenNeighbors.length) && <p className="text-muted">This node has no neighbor.</p>}

      {!!visibleNeighbors.length && (
        <>
          <div className="text-muted mb-2 mt-4">
            Tentaculos: {visibleNeighbors.length}{" "}
          </div>
          <ConnectionList visibleNeighbors={visibleNeighbors} node={node}/>
        </>
      )}

      {/* TODO: Modularize summary */}
      {/* Poner summary de las corporaciones */}
      {!!hiddenNeighbors.length && (
        <>
          <div className="text-muted mb-2 mt-4">
            This node{!!visibleNeighbors.length ? " also" : ""} has{" "}
            {hiddenNeighbors.length > 1 ? hiddenNeighbors.length + " neighbors " : "one neighbor "}
            that {hiddenNeighbors.length > 1 ? "are" : "is"} currently filtered out:
          </div>
          <ConnectionList visibleNeighbors={hiddenNeighbors} node={node}/>
        </>
      )}
    </div>
  );
};

export default SelectedNodePanel;
