import React, { FC } from "react";
import { AiOutlineHeart } from "react-icons/ai";
import { BsCodeSlash } from "react-icons/bs";
import { Link } from "react-router-dom";

import Matomo from "./Matomo";

const Footer: FC = () => (
  <>
    <div className="d-flex flex-row align-items-center">
      
      Pulpo-o es una herramienta hecha
    </div>
    <Matomo />
  </>
);

export default Footer;
