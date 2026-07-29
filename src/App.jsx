import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Draw from '@/pages/Draw';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Draw />} />
        {/* Redirect any old links directly to the draw canvas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
