import chroma from "chroma-js";
import _, { max, min, sortBy } from "lodash";
import { Dimensions } from "sigma/types";

import { findRanges } from "../utils/number";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE_RATIO,
  EDGE_SIZE_MAX,
  EDGE_SIZE_MIN,
  GRADIENT,
  MAX_PALETTE_SIZE,
  NODE_DEFAULT_SIZE,
  NODE_SIZE_MAX,
  NODE_SIZE_MIN,
  PALETTES,
} from "./consts";
import { Data, countRanges, countTerms, filterNodes, getFilterableFields, getValue } from "./data";
import { NavState } from "./navState";

export interface TermsValue {
  id: string;
  label: string;
  globalCount: number;
  filteredCount: number;
}
export interface RangeValue {
  min: number;
  max: number;
  label: string;
  globalCount: number;
  filteredCount: number;
}
export interface TermsMetric {
  type: "quali";
  field: string;
  values: TermsValue[];
}
export interface RangeMetric {
  type: "quanti";
  field: string;
  unit: number;
  min: number;
  max: number;
  ranges: RangeValue[];
}
export interface SearchMetrics {
  type: "content";
  field: string;
  samples: string[];
}
export type Metric = TermsMetric | RangeMetric | SearchMetrics;
export interface ComputedData {
  filteredNodes?: Set<string> | null; // Only present when there are filters
  filteredEdges?: Set<string> | null; // Only present when there are filters
  metrics: Record<string, Metric>;

  // Color and size providers:
  // Only present when there is a selected color field
  nodeColors?: Record<string, string> | null;
  getColor?: ((value: any) => string) | null;
  // Only present when there is a selected size field
  getSize?: ((value: any) => number) | null;
  nodeSizes: Record<string, number>;
  edgeSizes: Record<string, number>;
  nodeSizeExtents: [number, number];
  edgeSizeExtents: [number, number];
}

export function getEmptyComputedData(): ComputedData {
  return {
    metrics: {},
    nodeSizes: {},
    edgeSizes: {},
    nodeSizeExtents: [0, Infinity],
    edgeSizeExtents: [0, Infinity],
  };
}

// Node color logic writen in this layer
// Edge styling and edge color written in next layer
export function getNodeColors(
  { graph, fieldsIndex }: Data,
  { nodeColorField }: Pick<NavState, "nodeColorField">,
): Pick<ComputedData, "getColor" | "nodeColors"> {

  const result: Pick<ComputedData, "getColor" | "nodeColors"> = {};
  result.nodeColors = {};
  const field = fieldsIndex[nodeColorField];
  let getColor: ComputedData["getColor"] = null;

  // TODO: Put colors in const file
  const colorsDict: Record<string, string> = {
    "corporation": "#417AFB",
    "individual": "#d7fb41",
    "government_entity": "#D67FFC",
    "politician": "#AD05F8",
    "Junta de directores": "#BE35FA",
    "Secretario": "#BE35FA",
    "position": "#EEC9FE"
  }
  getColor = (value: any) => colorsDict[value];
  graph.forEachNode((node, nodeData) => {
    result.nodeColors![node] = getColor!(getValue(nodeData, field));
  });

  result.getColor = getColor;

  return result;
}


export function getNodeSizes(
  { graph, fieldsIndex }: Data,
  { nodeSizeField, nodeSizeRatio }: NavState,
  { width, height }: Dimensions,
): Pick<ComputedData, "getSize" | "nodeSizes" | "nodeSizeExtents"> {

  let nodeSizes: ComputedData["nodeSizes"];
  let getSize: ComputedData["getSize"] = null;
  let nodeSizeExtents: ComputedData["nodeSizeExtents"] = [0, Infinity];

  const ratio = nodeSizeRatio || DEFAULT_NODE_SIZE_RATIO;
  const screenSizeRatio = Math.min(width, height) / 1000;
  const graphSizeRatio = 1 / Math.log10(graph.order + 2);

  nodeSizes = {};
  const field = fieldsIndex[nodeSizeField];
  // TODO: This can be made much better
  const foo = (value: any, nodeData: any): number => {
    // Hardcoded for government agencies
    if (nodeData.label === "ASES" || nodeData.label === "ASSMCA"){
      return 20;
    } else {
      // Otherwise this
      const size =
        typeof value === "number"
          ? ((NODE_SIZE_MAX - NODE_SIZE_MIN) * (value - field.min)) / (field.max - field.min) + NODE_SIZE_MIN
          : NODE_DEFAULT_SIZE;
      return size * ratio * screenSizeRatio * graphSizeRatio;
    } 
  };
  graph.forEachNode((node, nodeData) => {
    nodeSizes![node] = foo!(getValue(nodeData, field), nodeData);
  });
  nodeSizeExtents = [field.min, field.max];
  return { getSize, nodeSizes, nodeSizeExtents };

}

export function getEdgeSizes(
  { graph, edgesSizeField }: Data,
  { edgeSizeRatio }: NavState,
  { width, height }: Dimensions,
): Pick<ComputedData, "edgeSizeExtents" | "edgeSizes"> {
  const ratio = edgeSizeRatio || DEFAULT_NODE_SIZE_RATIO;
  const screenSizeRatio = Math.min(width, height) / 1000;
  const graphSizeRatio = 1 / Math.log10(graph.order + 2);

  const values = graph.mapEdges((edge, { attributes }) => attributes[edgesSizeField]);
  const edgeSizeExtents: ComputedData["edgeSizeExtents"] = [min(values) as number, max(values) as number];
  if (edgeSizeExtents[0] === edgeSizeExtents[1]) edgeSizeExtents[0] = 0;

  const edgeSizes: ComputedData["edgeSizes"] = {};
  graph.forEachEdge((edge, { attributes }) => {
    edgeSizes[edge] =
      (((EDGE_SIZE_MAX - EDGE_SIZE_MIN) * ((attributes[edgesSizeField] || edgeSizeExtents[0]) - edgeSizeExtents[0])) /
        (edgeSizeExtents[1] - edgeSizeExtents[0]) +
        EDGE_SIZE_MIN) *
      ratio *
      screenSizeRatio *
      graphSizeRatio;
  });

  if (edgeSizeExtents[0] === edgeSizeExtents[1]) edgeSizeExtents[0] = 0;

  return { edgeSizes, edgeSizeExtents };
}

// TODO: Figure out que hace esto
export function getMetrics(
  data: Data,
  navState: Pick<NavState, "filters" | "filterable" | "colorable" | "sizeable">,
  currentMetrics?: ComputedData["metrics"],
): Pick<ComputedData, "metrics" | "filteredNodes" | "filteredEdges"> {
  const { graph } = data;
  const allFilterable = getFilterableFields(data, navState);

  currentMetrics = currentMetrics || {};
  const metrics: ComputedData["metrics"] = {};

  // 1. Filter nodes and edges:
  const nodes = filterNodes(data, navState);
  const nodesArray = nodes ? Array.from(nodes) : null;
  const filteredNodes = nodes;
  const filteredEdges = nodes
    ? new Set(graph.filterEdges((edge, attributes, source, target) => nodes.has(source) && nodes.has(target)))
    : null;

  // 2. Count metrics:
  allFilterable?.forEach((field) => {
    const oldMetric = currentMetrics![field.id];

    switch (field.type) {
      case "quali": {
        const globalCounts: Record<string, number> = oldMetric
          ? (oldMetric as TermsMetric).values.reduce((iter, v) => ({ ...iter, [v.id]: v.globalCount }), {})
          : countTerms(graph, field);
        const counts = nodesArray ? countTerms(graph, field, nodesArray) : globalCounts;
        metrics[field.id] = {
          type: "quali",
          field: field.id,
          values: sortBy(
            Object.values(field.values).map((value) => ({
              id: value.id,
              label: value.label,
              globalCount: globalCounts[value.id] || 0,
              filteredCount: counts[value.id] || 0,
            })),
            (o) => -o.globalCount,
          ),
        };
        break;
      }
      case "quanti": {
        if (oldMetric) {
          const { unit, ranges, min, max } = oldMetric as RangeMetric;
          const newRanges = ranges.map((v) => [v.min, v.max] as [number, number]);
          const counts = nodesArray ? countRanges(graph, field, newRanges, nodesArray) : null;
          metrics[field.id] = {
            type: "quanti",
            field: field.id,
            unit,
            min,
            max,
            ranges: ranges.map((v, i) => ({
              ...v,
              filteredCount: (counts ? counts[i] : v.globalCount) || 0,
            })),
          };
        } else {
          const { ranges, unit } = findRanges(field.min, field.max);
          const globalCounts = countRanges(graph, field, ranges);
          const counts = nodesArray ? countRanges(graph, field, ranges, nodesArray) : globalCounts;
          const values = graph
            .mapNodes((n, nodeData) => getValue(nodeData, field))
            .filter((v) => typeof v === "number");
          metrics[field.id] = {
            type: "quanti",
            field: field.id,
            unit,
            min: min(values),
            max: max(values),
            ranges: ranges.map(([min, max], i) => ({
              min,
              max,
              label: `${min} - ${max}`,
              globalCount: globalCounts[i],
              filteredCount: counts[i],
            })),
          };
        }
        break;
      }
      case "content": {
        metrics[field.id] = oldMetric || {
          type: "content",
          field: field.id,
          samples: _(graph.nodes())
            .map((node) => getValue(graph.getNodeAttributes(node), field))
            .filter((str) => !!str)
            .uniq()
            .take(3)
            .value(),
        };
        break;
      }
    }
  });

  return { metrics, filteredNodes, filteredEdges };
}
