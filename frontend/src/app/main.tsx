import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles/index.css";

// This is to deal with some limitations with immer
import { enableMapSet } from "immer";
enableMapSet();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
