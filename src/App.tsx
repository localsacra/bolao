import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Predictions } from './pages/Predictions';
import { Leaderboard } from './pages/Leaderboard';
import { Admin } from './pages/Admin';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/predictions" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
