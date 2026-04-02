import './App.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import About from './pages/About.jsx';
import Couples from './pages/Couples.jsx';
import Home from './pages/Home.jsx';

function App() {
  return (
    <BrowserRouter>
      <main className="flex h-screen min-h-0 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/couples" element={<Couples />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
