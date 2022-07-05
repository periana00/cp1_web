import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import Search from "./routes/main"
import Result from "./routes/search";
import Chart from "./routes/search/chart";
import News from "./routes/search/news";


import reportWebVitals from './reportWebVitals';


import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Search />}>
          <Route path="search" element={<Result />}>
            <Route path="chart" element={<Chart />} />
            <Route path="news" element={<News />} />
          </Route>
        </Route>
        {/* <Route
          path="*"
          element={
            <main style={{ padding: "1rem" }}>
              <p>There's nothing here!</p>
            </main>
          }
        /> */}
      </Routes>
    </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
