

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Loginn.jsx";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Flocks from "./pages/Flocks";
import Production from "./pages/Production";
import RawMaterials from "./pages/RawMaterials";
import FeedFormulas from "./pages/FeedFormulas";
import Inventory from "./pages/Inventory";
import EggSales from "./pages/EggSales";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import FeedConsumption from "./pages/FeedConsumption";
import FeedProduction from "./pages/FeedProduction";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/flocks" element={<Flocks />} />
        <Route path="/production" element={<Production />} />
        <Route path="/raw-materials" element={<RawMaterials />} />
        <Route path="/feed-formulas" element={<FeedFormulas />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/egg-sales" element={<EggSales />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/feed-consumption" element={<FeedConsumption />} />
        <Route path="/feed-production" element={<FeedProduction />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
