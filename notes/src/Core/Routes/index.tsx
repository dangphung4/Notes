import { Routes, Route } from 'react-router-dom';
import NewNote from '../Pages/NewNote';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/notes/new" element={<NewNote />} />
      {/* other routes... */}
    </Routes>
  );
} 