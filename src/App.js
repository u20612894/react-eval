import './App.css';

import {
  BrowserRouter, Routes, Route
} from 'react-router-dom';
import Dashboard from './Dashboard';
import VendStatus from './VendStatus';
import VendEvent from './VendEvent';
import FreeVend from './FreeVend';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VendStatus />} />
        <Route path="/VendEvent" element={<VendEvent />} />
        <Route path="/FreeVend" element={<FreeVend />} />

      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppRoutes />
  );
}

export default App;
