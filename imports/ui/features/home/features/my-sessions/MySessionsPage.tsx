import React from 'react';
import type { FC } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { KawaiiButton } from '../../../../common-ui/kawaii-button/KawaiiButton';
import { AuthContext } from '../../../../auth-context/AuthContext';
import { SessionsCollection } from '../../../../../api/sessions';

export const MySessionsPage: FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { mySessions, isLoading } = useTracker(() => {
    if (!user) {
      return { mySessions: [], isLoading: false };
    }

    const handle = Meteor.subscribe('sessions.byAdminId', user.id);
    const loading = !handle.ready();

    const sessions = SessionsCollection.find({ adminId: user.id }).fetch();

    return {
      mySessions: sessions,
      isLoading: loading,
    };
  }, [user]);

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-700'>Please log in to see your sessions.</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-3xl font-bold text-purple-600'>
              📋 My Sessions
            </h1>
            <div className='flex gap-2'>
              <KawaiiButton onClick={() => navigate('/create-session')}>
                ✨ Create New
              </KawaiiButton>
              <KawaiiButton onClick={() => navigate('/')} variant='secondary'>
                🏠 Home
              </KawaiiButton>
            </div>
          </div>

          {isLoading ? (
            <div className='text-center py-12 text-gray-700'>
              Loading sessions...
            </div>
          ) : mySessions.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>📝</div>
              <h2 className='text-xl font-bold text-gray-600 mb-2'>
                No sessions yet!
              </h2>
              <p className='text-gray-500 mb-6'>
                Create your first session to get started.
              </p>
              <KawaiiButton onClick={() => navigate('/create-session')}>
                ✨ Create First Session
              </KawaiiButton>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {mySessions.map((session) => (
                <div
                  key={session._id}
                  className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-bold text-gray-800'>
                      {session.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        session.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {session.isActive ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  </div>

                  <div className='space-y-2 mb-4'>
                    <div className='text-sm text-gray-600'>
                      🔑 Code:{' '}
                      <span className='font-mono font-bold'>
                        {session.code}
                      </span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      📝 {session.questions.length} questions
                    </div>
                    <div className='text-sm text-gray-600'>
                      👥 {session.participants.length} participants
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <KawaiiButton
                      onClick={() => navigate(`/session/${session.code}/admin`)}
                      variant='primary'
                      className='flex-1'
                    >
                      🎮 Manage
                    </KawaiiButton>
                    <KawaiiButton
                      onClick={() => navigate(`/edit-session/${session._id}`)}
                      variant='secondary'
                      className='flex-1'
                    >
                      ✏️ Edit
                    </KawaiiButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
