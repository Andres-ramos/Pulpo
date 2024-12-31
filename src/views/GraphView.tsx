import { SigmaContainer } from "@react-sigma/core";
import cx from "classnames";
import React, { FC, createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BsChevronDoubleLeft, BsChevronDoubleRight } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router";
import Sigma from "sigma";
import { Dimensions } from "sigma/types";
import GraphControls from "./GraphControls";

import { LoaderFill } from "../components/Loader";
import {
  ComputedData,
  getEdgeSizes,
  getEmptyComputedData,
  getMetrics,
  getNodeColors,
  getNodeSizes,
} from "../lib/computedData";
import { BASE_SIGMA_SETTINGS } from "../lib/consts";
import { GraphContext, Panel } from "../lib/context";
import { Data, enrichData, loadGraphFile, loadGraphURL, prepareGraph, readGraph } from "../lib/data";
import {
  BAD_FILE,
  BAD_URL,
  MISSING_FILE,
  MISSING_URL,
  UNKNOWN,
  getErrorMessage,
  getReportNotification,
} from "../lib/errors";
// import { applyGraphStyle } from "../lib/graph";
import { NavState, cleanNavState, guessNavState, navStateToQueryURL, queryURLToNavState } from "../lib/navState";
import EventsController from "./EventsController";
import GraphAppearance from "./GraphAppearance";
import { applyGraphStyle } from "../lib/graph";
import { hiddenReducer } from "../lib/consts";
import NodeSizeCaption from "./NodeSizeCaption";
import LeftPanel from "./LeftPanel";
import { ModalName, MODALS } from "./modals";
import Header from "./Header";
import Modal from "../components/Modal";

const GraphView: FC<{ embed?: boolean }> = ({ embed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(true); // set default value as `!embed` to get an overlay

  const state = location.state as { file?: unknown; fromHome?: unknown } | undefined;
  const localFile = useMemo(() => (state?.file instanceof File ? state.file : null), [state]);
  const fromHome = useMemo(() => !!state?.fromHome, [state]);

  const domRoot = useRef<HTMLElement>(null);
  const [sigma, setSigma] = useState<Sigma | undefined>(undefined);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 1000, height: 1000 });
  const [hovered, setHovered] = useState<string | Set<string> | undefined>(undefined);
  const [graphFile, setGraphFile] = useState<{
    name: string;
    extension: string;
    textContent: string;
  } | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const rawNavState = useMemo(() => queryURLToNavState(location.search), [location.search]);

  const [modalName, setModalName] = useState<ModalName | undefined>("disclaimer");
  const [panel, setPanel] = useState<Panel>(rawNavState.role === "d" ? "edit" : "main");
  const [panelExpanded, setPanelExpanded] = useState(!embed);
  const url = useMemo(() => rawNavState.url, [rawNavState]);
  const local = useMemo(() => rawNavState.local, [rawNavState]);
  const navState = useMemo(() => (data ? cleanNavState(rawNavState, data) : null), [rawNavState, data]);
  const setNavState = useCallback(
    (newNavState: NavState) => {
      navigate(
        location.hash.replace(/^#/, "").replace(/\?.*/, "") +
          "?" +
          navStateToQueryURL(data ? cleanNavState(newNavState, data) : newNavState),
      );
    },
    [data, location.hash, navigate],
  );

  const [computedData, setComputedData] = useState<ComputedData | null>(null);

  // Refresh aggregations and filtered items lists:
  useEffect(() => {
    if (data) {
      setComputedData((old) => ({
        nodeSizes: {},
        edgeSizes: {},
        nodeSizeExtents: [0, Infinity],
        edgeSizeExtents: [0, Infinity],
        ...old,
        ...getMetrics(
          data,
          {
            filters: navState?.filters,
            filterable: navState?.filterable,
            colorable: navState?.colorable,
            sizeable: navState?.sizeable,
          },
          old?.metrics,
        ),
      }));
    }
  }, [sigma, data, navState?.filters, navState?.filterable, navState?.colorable, navState?.sizeable]);

  // On first computedData update, apply graph style:
  useEffect(() => {
    if (data && computedData && navState && !sigma) {
      applyGraphStyle(data, computedData, navState);
    }
  }, [sigma, data, navState, computedData]);

  // Keep dimensions up to date:
  useEffect(() => {
    if (!sigma) return;

    const handler = () => setDimensions(sigma.getDimensions());
    sigma.on("resize", handler);
    return () => {
      sigma.off("resize", handler);
    };
  }, [sigma]);

  // Refresh node colors and sizes:
  useEffect(() => {
    if (data) {
      setComputedData((current) => ({
        ...(current || getEmptyComputedData()),
        ...getNodeColors(data, { nodeColorField: navState?.nodeColorField }),
      }));
    }
  }, [data, navState?.nodeColorField]);
  useEffect(() => {
    if (data) {
      setComputedData((current) => ({
        ...(current || getEmptyComputedData()),
        ...getNodeSizes(
          data,
          { nodeSizeField: navState?.nodeSizeField, nodeSizeRatio: navState?.nodeSizeRatio },
          dimensions,
        ),
      }));
    }
  }, [data, navState?.nodeSizeField, navState?.nodeSizeRatio, dimensions]);
  useEffect(() => {
    if (data) {
      setComputedData((current) => ({
        ...(current || getEmptyComputedData()),
        ...getEdgeSizes(data, { edgeSizeRatio: navState?.edgeSizeRatio }, dimensions),
      }));
    }
  }, [data, navState?.edgeSizeRatio, dimensions]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!ready) return;

    let promise:
      | Promise<{
          name: string;
          extension: string;
          textContent: string;
        }>
      | undefined;

    // Hardcoded
    promise = loadGraphFile();
    if (promise) {
      promise
        .then(({ name, extension, textContent }) => {
          setGraphFile({ name, extension, textContent });
          return readGraph({ name, extension, textContent });
        })
        .then((rawGraph) => prepareGraph(rawGraph))
        .then(({ graph, report }) => {
          const richData = enrichData(graph);
          setData(richData);
          setNavState({
            ...rawNavState,
            ...guessNavState(richData, report),
          });
        })
        .catch((e) => {
          const error = e.name === BAD_URL ? BAD_URL : BAD_FILE;
          console.error(getErrorMessage(error).replace(/\.$/, "") + ":");
          console.error(e.message);
          navigate("/?", {
            state: {
              error: error,
            },
          });
        });
    } 
  }, [url, local, ready]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (!ready)
    return (
      <div
        className="fill flex-centered flex-column hoverable"
        tabIndex={0}
        role="dialog"
        onClick={() => setReady(true)}
      >
        <p>
          <img src={import.meta.env.BASE_URL + "logo.svg"} alt="Retina logo" style={{ height: "4em" }} />
        </p>
        <p className="fs-3">Click here to see the graph visualization</p>
      </div>
    );

  if (!data || !graphFile || !navState || !computedData) return <LoaderFill />;

  return (
    <GraphContext.Provider
      value={{
        embedMode: !!embed,
        data,
        navState,
        computedData,
        graphFile,
        setNavState,
        hovered,
        setHovered,

        modal: modalName,
        openModal: (modal: ModalName) => setModalName(modal),
        closeModal: () => setModalName(undefined),

        panel,
        setPanel,

        sigma,
        setSigma,
        root: domRoot.current || undefined,
      }}
    >
      <main className={cx("graph-view", panelExpanded ? "collapsed" : "expanded")} ref={domRoot}>

        {/* <Header /> */}
        <div className="wrapper">
          <LeftPanel />
          <section className="graph">
            <SigmaContainer
              className={cx("sigma-wrapper", !!hovered && "cursor-pointer")}
              graph={data.graph}
              settings={BASE_SIGMA_SETTINGS}
            >
              <EventsController/> 
              <GraphAppearance/>


              <div className="controls">
                <GraphControls />
              </div>

              <div className="captions">
                <NodeSizeCaption />
              </div>
            </SigmaContainer>
            
          </section>
        </div>

        <button
          className={cx(
            "btn btn-outline-dark toggle-button graph-button",
            navState.role === "d" && "bg-info text-black",
          )}
          onClick={() => setPanelExpanded((v) => !v)}
          title="Toggle side panel"
        >
          {panelExpanded ? <BsChevronDoubleLeft /> : <BsChevronDoubleRight />}
        </button>
      </main>

      {/* Currently opened modal: */}
      {modalName && createElement(MODALS["disclaimer"], { close: () => setModalName(undefined) })}
    </GraphContext.Provider>
  );
};

export default GraphView;
