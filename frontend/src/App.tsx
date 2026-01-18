import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ResumeUpload from './pages/ResumeUpload';
import Skills from './pages/Skills';
import Recommendations from './pages/Recommendations';
import GitHubTab from './pages/GitHub';
import CareerPathways from './pages/CareerPathways.tsx';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="upload" element={<ResumeUpload />} />
          <Route path="skills" element={<Skills />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="github" element={<GitHubTab />} />
          <Route path="pathways" element={<CareerPathways />} />
          <Route path="courses" element={<Navigate to="/dashboard/github" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
