import React, { useState, useContext, KeyboardEvent } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { KawaiiInput } from '../../common-ui/kawaii-input/KawaiiInput';
import { KawaiiButton } from '../../common-ui/kawaii-button/KawaiiButton';
import { AuthContext } from '../../auth-context/AuthContext';

export const HomePage: FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleJoinSession = () => {
    if (!sessionCode.trim()) return;

    setLoading(true);
    setError(null);

    Meteor.call(
      'sessions.addParticipant',
      sessionCode.trim(),
      user,
      (err: Meteor.Error | undefined) => {
        setLoading(false);
        if (err) {
          setError(err.message);
        } else {
          navigate(`/session/${sessionCode.trim()}/join`);
        }
      }
    );
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinSession();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center mb-12'>
          <h1 className='text-6xl font-bold text-white mb-4'>
            ✨ Kawaii Slido ✨
          </h1>
          <p className='text-xl text-white opacity-90'>
            Welcome back, {user?.name}! 🌸
          </p>
        </div>

        <div className='bg-white rounded-3xl shadow-2xl p-8 mb-8'>
          <h2 className='text-2xl font-bold text-purple-600 mb-6 text-center'>
            Join a Session 🎯
          </h2>
          <div className='space-y-4'>
            <KawaiiInput
              placeholder='Enter session code 🔑'
              value={sessionCode}
              onChange={setSessionCode}
              onKeyPress={handleKeyPress}
              autoFocus
              disabled={loading}
            />
            <KawaiiButton
              onClick={handleJoinSession}
              className='w-full'
              disabled={loading}
            >
              {loading ? 'Joining...' : '🚀 Join Session'}
            </KawaiiButton>
            {error && <p className='text-red-600 text-center'>{error}</p>}
          </div>
        </div>

        {user?.isAdmin && (
          <div className='bg-white rounded-3xl shadow-2xl p-8'>
            <h2 className='text-2xl font-bold text-purple-600 mb-6 text-center'>
              Admin Actions 👑
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <KawaiiButton
                onClick={() => navigate('/create-session')}
                variant='primary'
                className='w-full'
              >
                ✨ Create New Session
              </KawaiiButton>
              <KawaiiButton
                onClick={() => navigate('/my-sessions')}
                variant='secondary'
                className='w-full'
              >
                📋 My Sessions
              </KawaiiButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
