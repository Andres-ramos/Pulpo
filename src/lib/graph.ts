import chroma from "chroma-js";
import { Attributes } from "graphology-types";
import { isNil, isSet, memoize } from "lodash";
import { Settings } from "sigma/settings";

import { ComputedData } from "./computedData";
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_EDGE_SIZE_RATIO,
  DEFAULT_LABEL_SIZE,
  DEFAULT_NODE_SIZE_RATIO,
  HIDDEN_NODE_COLOR,
  HIGHLIGHTED_EDGE_SIZE_RATIO,
  HIGHLIGHTED_NODE_COLOR,
} from "./consts";

import { Data, EdgeData, NodeData, getValue } from "./data";
import { NavState } from "./navState";

const getLighterColor = memoize((color: string): string => {
  return chroma.average([color, HIDDEN_NODE_COLOR], "lab").hex();
});

export function applyNodeColors({ graph }: Data, { nodeColors }: Pick<ComputedData, "nodeColors">) {
  graph.forEachNode((node, { rawColor }) =>
    graph.setNodeAttribute(node, "color", nodeColors ? nodeColors[node] : rawColor),
  );
}

export function applyNodeSizes(
  { graph }: Data,
  { nodeSizes }: Pick<ComputedData, "nodeSizes">,
  { nodeSizeRatio }: Pick<NavState, "nodeSizeRatio">,
) {
  const ratio = typeof nodeSizeRatio === "number" ? nodeSizeRatio : DEFAULT_NODE_SIZE_RATIO;
  graph.forEachNode((node, { rawSize }) => {
    graph.setNodeAttribute(node, "size", (nodeSizes ? nodeSizes[node] : rawSize) * ratio)
    graph.setNodeAttribute(node, 'border', ('black'))
  }
    
  );
}

export function applyNodeLabelSizes(
  { graph, fieldsIndex }: Data,
  { nodeSizeExtents }: Pick<ComputedData, "nodeSizeExtents">,
  { nodeSizeField, minLabelSize, maxLabelSize }: Pick<NavState, "nodeSizeField" | "minLabelSize" | "maxLabelSize">,
) {
  const minSize = typeof minLabelSize === "number" ? minLabelSize : DEFAULT_LABEL_SIZE;
  const maxSize = typeof maxLabelSize === "number" ? maxLabelSize : DEFAULT_LABEL_SIZE;
  const extentDelta = nodeSizeExtents[1] - nodeSizeExtents[0];
  const factor = (maxSize - minSize) / (extentDelta || 1);
  graph.forEachNode((node, nodeData) => {
    const nodeSize = nodeSizeField ? getValue(nodeData, fieldsIndex[nodeSizeField]) : nodeData.rawSize;
    graph.setNodeAttribute(node, "labelSize", minSize + (nodeSize - nodeSizeExtents[0]) * factor);
  });
}

export function applyNodeSubtitles({ graph, fieldsIndex }: Data, { subtitleFields }: Pick<NavState, "subtitleFields">) {
  graph.forEachNode((node, nodeData) =>
    graph.setNodeAttribute(
      node,
      "subtitles",
      subtitleFields
        ? subtitleFields.flatMap((f) => {
            const field = fieldsIndex[f];
            const val = getValue(nodeData, field);
            return isNil(val) ? [] : [`${field.label}: ${typeof val === "number" ? val.toLocaleString() : val}`];
          })
        : [],
    ),
  );
}

// Apply edge colors no usa computed data
export function applyEdgeColors(
  { graph }: Data,
) {

  const getColor = (edge: string, data:any):any => {
    const colorMap = {
      "officer": "#3c4b02",
      "agent": "#3c4b02",
      "incorporator":"#3c4b02",
      "contract": "#3c4b02",
      "donation": "#3c4b02",
      "junta_directores": "#3c4b02",
      "dirige": "#3c4b02",
      "position": "#3c4b02",
      "is": "#3c4b02"
    }
    return colorMap[data.attributes.label]
  };
  graph.forEachEdge((edge, data) => graph.setEdgeAttribute(edge, "color", "#3c4b02"));
}

export function applyEdgeDirections({ graph }: Data, { edgeDirection }: Pick<NavState, "edgeDirection">) {
  let getDirection: (edge: string, data: EdgeData) => boolean | undefined;

  switch (edgeDirection) {
    case "d":
      getDirection = () => true;
      break;
    case "u":
      getDirection = () => false;
      break;
    case "o":
    default:
      getDirection = (edge) => graph.isDirected(edge);
  }

  graph.forEachEdge((edge, data) => {
    const directed = getDirection(edge, data);
    graph.mergeEdgeAttributes(edge, { directed, type: directed ? "arrow" : undefined });
  });
}

export function applyEdgeSizes(
  { graph }: Data,
  { edgeSizes }: Pick<ComputedData, "edgeSizes">,
  { edgeSizeRatio }: Pick<NavState, "edgeSizeRatio">,
) {
  // Antes esta logica se aplicaba a partir de lo que se extrajo dinamicamente
  // En este caso lo cambie para que la logica del styling este aqui tambien
  const ratio = typeof edgeSizeRatio === "number" ? edgeSizeRatio : DEFAULT_EDGE_SIZE_RATIO;
  const getEdgeSize = (edge:string , data: any): any => {   
    const sizeMap = {
      "officer": 1,
      "agent": 1,
      "incorporator": 1,
      "donation": 1,
      "contract": 1
    }
    return sizeMap[data.attributes.label]

  }
  graph.forEachEdge((edge, data) =>
    graph.setEdgeAttribute(edge, "size", 1),
  );
}

export function applyEdgeStyles(
  {graph}: Data
) {

  const m = {
    "contract": "straight",
    "donation": "straight",
    "officer": "straight",
    "incorporator": "straight",
    "agent": "straight",
    "is": "straight",
    "position": "straight",
    "dirige": "straight"
  }
  graph.forEachEdge((edge, data) =>{
    console.log(data.attributes)
    graph.setEdgeAttribute(edge, "type", m[data.attributes.label])
  })
}

export function applyGraphStyle(data: Data, computedData: ComputedData, navState: NavState) {
  applyNodeColors(data, computedData);
  applyNodeSizes(data, computedData, navState);
  applyNodeLabelSizes(data, computedData, navState);
  applyNodeSubtitles(data, navState);
  applyEdgeColors(data);  //Doesn't use nav state or computed data
  applyEdgeDirections(data, navState);
  applyEdgeSizes(data, computedData, navState);
}

export function getReducers(
  dataset: Data,
  navState: NavState,
  computedData: ComputedData,
  hovered: string | Set<string> | undefined,
): {
  node: NonNullable<Settings["nodeReducer"]>;
  edge: NonNullable<Settings["edgeReducer"]>;
} {
  const { graph } = dataset;
  const { selectedNode } = navState;
  const { filteredNodes } = computedData;

  const greyedOutNodes = new Set<string>();
  const emphasizedNodesSet = new Set<string>();
  const highlightedNodesSet = new Set<string>();

  if (isSet(hovered)) {
    if (selectedNode) highlightedNodesSet.add(selectedNode);

    graph.forEachNode((n) => {
      if (hovered.has(n)) {
        emphasizedNodesSet.add(n);
      } else if (n !== selectedNode) {
        greyedOutNodes.add(n);
      }
    });
  } else if (typeof hovered === "string" || selectedNode) {
    if (hovered) {
      highlightedNodesSet.add(hovered);
      emphasizedNodesSet.add(hovered);
    }
    if (selectedNode) {
      highlightedNodesSet.add(selectedNode);
      emphasizedNodesSet.add(selectedNode);
    }

    const highlightedNodes = Array.from(highlightedNodesSet);
    graph.forEachNode((n) => {
      if (highlightedNodes.some((highlightedNode) => graph.areNeighbors(n, highlightedNode))) {
        emphasizedNodesSet.add(n);
      } else if (!highlightedNodesSet.has(n)) {
        greyedOutNodes.add(n);
      }
    });
  }

  return {
    node(node: string, anyData: Attributes) {
      const data = anyData as NodeData;
      const res = { ...anyData };

      let noLabel = false;

      if (emphasizedNodesSet.has(node)) {
        res.color = data.color;
        res.borderColor = HIGHLIGHTED_NODE_COLOR;
        res.type = "bordered";
        res.zIndex = 1000;
        noLabel = false;
      } else if (filteredNodes && !filteredNodes.has(node)) {
        res.color = HIDDEN_NODE_COLOR;
        noLabel = true;
      } else if (greyedOutNodes.has(node)) {
        res.color = getLighterColor(data.color);
        noLabel = true;
      }

      if (highlightedNodesSet.has(node)) {
        res.highlighted = true;
        noLabel = false;
      }

      if (noLabel) {
        res.hideLabel = true;
        res.subtitles = [];
        res.zIndex = -1;
      }

      return res;
    },
    edge(edge: string, data: Attributes) {
      const res = { ...data };
      // Commented to remove raise condition :)
      // if (graph.extremities(edge).some((n) => greyedOutNodes.has(n) || (filteredNodes && !filteredNodes.has(n)))) {
      //   res.hidden = true;
      // }

      if (hovered || selectedNode) {
        res.size *= HIGHLIGHTED_EDGE_SIZE_RATIO;
      }

      return res;
    },
  };
}
