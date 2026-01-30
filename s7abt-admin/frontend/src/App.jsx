
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { AuthProvider } from './contexts/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleForm from './pages/ArticleForm';
import ArticleView from './pages/ArticleView';
import News from './pages/News';
import NewsForm from './pages/NewsForm';
import Tweets from './pages/Tweets';
import TweetGenerate from './pages/TweetGenerate';
import Sections from './pages/Sections';
import Tags from './pages/Tags';
import Settings from './pages/Settings';
import Insights from './pages/Insights';
import Users from './pages/Users';
import UserForm from './pages/UserForm';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Articles */}
            <Route path="articles" element={<Articles />} />
            <Route path="articles/new" element={<ArticleForm />} />
            <Route path="articles/:id" element={<ArticleView />} />
            <Route path="articles/:id/edit" element={<ArticleForm />} />

            {/* News */}
            <Route path="news" element={<News />} />
            <Route path="news/new" element={<NewsForm />} />
            <Route path="news/:id/edit" element={<NewsForm />} />

            {/* Tweets - Protected */}
            <Route path="tweets" element={
              <ProtectedRoute permPath="/tweets">
                <Tweets />
              </ProtectedRoute>
            } />
            <Route path="tweets/generate" element={
              <ProtectedRoute permPath="/tweets">
                <TweetGenerate />
              </ProtectedRoute>
            } />

            {/* Sections & Tags */}
            <Route path="sections" element={<Sections />} />
            <Route path="tags" element={<Tags />} />

            {/* Insights - Protected */}
            <Route path="insights" element={
              <ProtectedRoute permPath="/insights">
                <Insights />
              </ProtectedRoute>
            } />

            {/* Settings - Protected */}
            <Route path="settings" element={
              <ProtectedRoute permPath="/settings">
                <Settings />
              </ProtectedRoute>
            } />

            {/* Users - Protected */}
            <Route path="users" element={
              <ProtectedRoute permPath="/users">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="users/new" element={
              <ProtectedRoute permPath="/users">
                <UserForm />
              </ProtectedRoute>
            } />
            <Route path="users/:id/edit" element={
              <ProtectedRoute permPath="/users">
                <UserForm />
              </ProtectedRoute>
            } />

          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

