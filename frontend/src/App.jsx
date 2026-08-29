import "./App.css";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("dashboard")}>
          Dashboard
        </button>

        <button onClick={() => setPage("upload")}>
          Upload Inspection
        </button>
      </nav>

      {page === "dashboard" ? <Dashboard /> : <Upload />}
    </div>
  );
}

export default App;