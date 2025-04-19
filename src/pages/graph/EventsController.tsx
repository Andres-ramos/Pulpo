import { useRegisterEvents } from "@react-sigma/core";
import { FC, useContext, useEffect } from "react";

import { GraphContext } from "../../lib/context";
// import { Props } from "react-select";


const EventsController = ({}) => {
  const { setHovered, navState, setNavState, panelExpanded, setPanelExpanded } = useContext(GraphContext);
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    registerEvents({
      enterNode({ node }) {
        setHovered(node);
      },
      leaveNode() {
        setHovered(undefined);
      },
      clickNode({ node }) {
        setNavState({ ...navState, selectedNode: navState.selectedNode === node ? undefined : node });
        // Opens panel if panel was closed
        setPanelExpanded((v) => v ? !v : v )
      },
      clickStage() {
        if (navState.selectedNode) setNavState({ ...navState, selectedNode: undefined });
      },
      
    })
  }, [registerEvents, setHovered, navState, setNavState]);
  return null;
};

export default EventsController;
