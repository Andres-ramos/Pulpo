import { useContext, useEffect } from "react";
import { useRegisterEvents } from "@react-sigma/core";

import { GraphContext } from "../lib/context";
// import { Props } from "react-select";


const EventsController = () => {
  const { setHovered, navState, setNavState } = useContext(GraphContext);
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
      },
      clickStage() {
        if (navState.selectedNode) setNavState({ ...navState, selectedNode: undefined });
      },
    })
  }, [registerEvents, setHovered, navState, setNavState]);
  return null;
};

export default EventsController;
