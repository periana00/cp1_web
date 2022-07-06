import './search.scss';
import React, {useEffect, useState}  from 'react';
import { NavLink, Outlet, useLocation} from "react-router-dom";
import queryString from 'query-string';

export default function Search() {
  let location = useLocation()
  const query = queryString.parse(location.search);

  return (
    <div className='search'>
      <nav>
        <NavLink to={"chart" + location.search}>Chart</NavLink>
        <NavLink to={"news" + location.search}>News</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}