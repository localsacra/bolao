import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Predictions } from './pages/Predictions';
import { Leaderboard } from './pages/Leaderboard';
import { PlayerPredictions } from './pages/PlayerPredictions';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { useAuthStore } from './store/useAuthStore';
import { LanguageProvider } from './contexts/LanguageContext';
import { ReloadPrompt } from './components/ReloadPrompt';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/predictions" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="player/:playerId" element={<PlayerPredictions />} />
            <Route path="admin" element={<Admin />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
      <ReloadPrompt />
    </LanguageProvider>
  );
}

export default App;
