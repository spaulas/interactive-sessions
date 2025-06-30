import React from 'react';
import type { FC } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './auth-context/AuthContext';
import { LoginPage } from './features/login/LoginPage';
import { HomePage } from './features/home/HomePage';
import { CreateSessionPage } from './features/home/features/create-session/CreateSessionPage';
import { EditSessionPage } from './features/home/features/create-session/features/edit-session/EditSessionPage';
import { MySessionsPage } from './features/home/features/my-sessions/MySessionsPage';
import { JoinSessionPage } from './features/home/features/join-session/JoinSessionPage';
import { AdminView } from './features/home/features/join-session/features/admin-view/AdminView';
import { SuggestionsPage } from './features/home/features/suggestions/SuggestionsPage';
import '/client/main.css';

const AppRoutes: FC = () => {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div className='min-h-screen'>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route
            path='/'
            element={user ? <HomePage /> : <Navigate to='/login' />}
          />
          <Route
            path='/create-session'
            element={
              user?.isAdmin ? <CreateSessionPage /> : <Navigate to='/' />
            }
          />
          <Route
            path='/edit-session/:sessionId'
            element={user?.isAdmin ? <EditSessionPage /> : <Navigate to='/' />}
          />
          <Route
            path='/my-sessions'
            element={user?.isAdmin ? <MySessionsPage /> : <Navigate to='/' />}
          />
          <Route
            path='/session/:code/join'
            element={user ? <JoinSessionPage /> : <Navigate to='/login' />}
          />
          <Route
            path='/session/:code/admin'
            element={user?.isAdmin ? <AdminView /> : <Navigate to='/' />}
          />
          <Route
            path='/suggestions'
            element={user ? <SuggestionsPage /> : <Navigate to='/login' />}
          />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>

        {/* Bottom Navigation Bar */}
        {user && (
          <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200'>
            <div className='max-w-md mx-auto flex justify-around py-2'>
              <button
                onClick={() => (window.location.href = '/')}
                className='flex flex-col items-center py-2 px-4 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors'
              >
                <span className='text-xl'>🏠</span>
                <span className='text-xs'>Home</span>
              </button>

              {/* Uncomment if you want suggestions in the navbar */}
              {/* <button
                onClick={() => (window.location.href = '/suggestions')}
                className="flex flex-col items-center py-2 px-4 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <span className="text-xl">💡</span>
                <span className="text-xs">Suggest</span>
              </button> */}

              {user.isAdmin && (
                <button
                  onClick={() => (window.location.href = '/my-sessions')}
                  className='flex flex-col items-center py-2 px-4 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors'
                >
                  <span className='text-xl'>📋</span>
                  <span className='text-xs'>Sessions</span>
                </button>
              )}

              <button
                onClick={() => logout()}
                className='flex flex-col items-center py-2 px-4 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              >
                <span className='text-xl'>🚪</span>
                <span className='text-xs'>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export const App: FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);
