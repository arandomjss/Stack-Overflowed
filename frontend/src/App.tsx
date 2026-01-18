import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ResumeUpload from './pages/ResumeUpload';
import Skills from './pages/Skills';

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
          <Route path="courses" element={<div className="text-white">Courses Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
