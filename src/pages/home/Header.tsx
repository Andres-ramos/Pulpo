import React, { FC, createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineUserCircle } from "react-icons/hi";
import logo from "/logo.png"
const Header: FC = () => {
  return (
    <div className="header">
      <div className="logo">
        <img src={logo} width={128} height={64}>
        </img>
      </div>
      {/* <div className="bt-div">
        <button className="btn btn-lg button text-dark"> Sign Up</button>
        <button className="btn btn-lg button text-dark"> Log in</button>
      </div> */}

      {/* <HiOutlineUserCircle className="icons"/> */}
    </div>
  )
}

export default Header;