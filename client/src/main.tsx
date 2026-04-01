import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import 'flowbite/dist/flowbite.css';
// import 'react-toastify/dist/ReactToastify.css';
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
