import cx from "classnames";
import { map, mapKeys, omitBy, startCase, uniq } from "lodash";
import React, { FC, useContext } from "react";
import { BiRadioCircleMarked } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import Linkify from "react-linkify";
import { Coordinates } from "sigma/types";

import Connection from "../../../components/Connection";
import Node from "../../../components/Node";
import { ANIMATION_DURATION, DEFAULT_LINKIFY_PROPS, isHiddenRetinaField, removeRetinaPrefix } from "../../../lib/consts";
import { GraphContext } from "../../../lib/context";
import { NodeData } from "../../../lib/data";

import {ConnectionList} from "../../../components/ConnectionList"

import {Profile} from "./Profile";

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
  const nodeType = currentAttributes.attributes.value

  return (
    <div className="selected-nodes-block block">
         
      <Profile filteredAttributes={filteredAttributes} node={node} isHidden={isHidden} currentAttributes={currentAttributes} />

      <br />      
      <hr />

      {!(visibleNeighbors.length + hiddenNeighbors.length) && <p className="text-muted">This node has no neighbor.</p>}

      {!!visibleNeighbors.length && (
        <>
          <div className="text-muted mb-2 mt-4">
            Conexiones : {visibleNeighbors.length}{" "}
          </div>
          <ConnectionList visibleNeighbors={visibleNeighbors} node={node}/>
        </>
      )}

      {/* TODO: Modularize summary */}
      {/* Poner summary de las corporaciones */}
      {/* {!!hiddenNeighbors.length && (
        <>
          <div className="text-muted mb-2 mt-4">
            This node{!!visibleNeighbors.length ? " also" : ""} has{" "}
            {hiddenNeighbors.length > 1 ? hiddenNeighbors.length + " neighbors " : "one neighbor "}
            that {hiddenNeighbors.length > 1 ? "are" : "is"} currently filtered out:
          </div>
          <ConnectionList visibleNeighbors={hiddenNeighbors} node={node}/>
        </>
      )} */}
    </div>
  );
};

export default SelectedNodePanel;
