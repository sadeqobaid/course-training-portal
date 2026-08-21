import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CataloguePage } from './pages/CataloguePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { LearningPage } from './pages/LearningPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<CataloguePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route
              path="/my-courses"
              element={
                <ProtectedRoute>
                  <MyCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn/:enrollmentId"
              element={
                <ProtectedRoute>
                  <LearningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/:enrollmentId/:courseId"
              element={
                <ProtectedRoute>
                  <AssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace"
              element={
                <ProtectedRoute roles={['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<Navigate to="/workspace" replace />} />
            <Route path="*" element={<CataloguePage />} />
          </Routes>
        </main>
        <footer className="site-footer">Created by Sadeq Obaid</footer>
      </div>
    </BrowserRouter>
  );
}
