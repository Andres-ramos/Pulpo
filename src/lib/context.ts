import { createContext } from "react";
import { noop } from "lodash";
import Graph from "graphology";
import Sigma from "sigma";

import { Data } from "./data";
import { NavState } from "./navState";
import { ComputedData, getEmptyComputedData } from "./computedData";
import { ModalName } from "../views/modals";

export const PANELS = ["edit", "main", "readability"] as const;
export const PANELS_SET: Set<string> = new Set(PANELS);
export type Panel = typeof PANELS[number];

export const AppContext = createContext<{ portalTarget: HTMLDivElement }>({
  portalTarget: document.createElement("div"),
});

export const GraphContext = createContext<{
  embedMode: boolean;
  data: Data;
  graphFile: {
    name: string;
    extension: string;
    textContent: string;
  };

  navState: NavState;
  computedData: ComputedData;
  hovered: string | Set<string> | undefined;

  setNavState: (newNavState: NavState) => void;
  setHovered: (hovered?: string | Set<string>) => void;

  panel: Panel;
  setPanel: (panel: Panel) => void;

  modal: ModalName | undefined;
  openModal: (modal: ModalName) => void;
  closeModal: () => void;

  sigma: Sigma | undefined;
  setSigma: (sigma: Sigma | undefined) => void;
  root: HTMLElement | undefined;
}>(
  // "Fake" initial value (proper value will be given by Provider)
  {
    embedMode: false,
    hovered: undefined,
    data: {
      fields: [],
      fieldsIndex: {},
      edgeFields: [],
      edgeFieldsIndex: {},
      edgesSizeField: "",
      graph: new Graph(),
    },
    graphFile: {
      name: "",
      extension: "",
      textContent: "",
    },

    computedData: getEmptyComputedData(),
    navState: {},

    setNavState: noop,
    setHovered: noop,

    panel: "main",
    setPanel: noop,

    modal: undefined,
    openModal: noop,
    closeModal: noop,

    sigma: undefined,
    setSigma: noop,
    root: undefined,
  },
);
