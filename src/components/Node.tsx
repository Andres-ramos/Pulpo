import cx from "classnames";
import React, { FC, useContext } from "react";
import { Link } from "react-router-dom";

import { GraphContext } from "../lib/context";
import { NodeData } from "../lib/data";
import { navStateToQueryURL } from "../lib/navState";

const Node: FC<{
  node: string;
  attributes: NodeData;
  link?: boolean;
  className?: string;
}> = ({ node, attributes, link, className }) => {
  const {
    navState,
    setHovered,
    computedData: { filteredNodes },
  } = useContext(GraphContext);
 const baseClassName = "node fs-6 d-flex flex-row align-items-center";
  const content = (
    <>
      
      <span className="ellipsis">{attributes.label}</span>    
    </>
  );


  const linkStyle = {
    margin: "1rem",
    textDecoration: "none",
    color: 'black',
    fontWeight:"bold"
  };

  return link ? (
    <div >
      <Link
        className={cx(baseClassName, className)}
        onMouseEnter={() => setHovered(node)}
        onMouseLeave={() => setHovered(undefined)}
        to={"/graph/?" + navStateToQueryURL({ ...navState, selectedNode: node })}
        title={attributes.label || undefined}
        style={linkStyle}
      >
        {content}
      </Link>
    </div>
    
  ) : (
    <div className={cx(baseClassName, className)} title={attributes.label || undefined}>
      {content}
    </div>
  );
};

export default Node;
