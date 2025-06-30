import React, { useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data'; // <-- import this
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../../../auth-context/AuthContext';
import { ParticipantView } from './features/participants-view/ParticipantsView';
import { SessionsCollection } from '../../../../../api/sessions';

export const JoinSessionPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  // This is where you subscribe & fetch session from DB reactively
  const { session, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('sessions.byCode', code);
    const loading = !handle.ready();
    const sessionData = SessionsCollection.findOne({ code });
    return {
      session: sessionData,
      isLoading: loading,
    };
  }, [code]);

  // Once data is loaded, react to session and user
  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        navigate('/');
        return;
      }

      if (user && session.adminId === user.id) {
        navigate(`/session/${code}/admin`);
        return;
      }

      if (
        user &&
        !session.participants.find((p: { id: string }) => p.id === user.id)
      ) {
        Meteor.call('sessions.addParticipant', session.id, user, (err: any) => {
          if (err) {
            console.error('Failed to add participant', err);
          }
        });
      }
    }
  }, [session, user, code, navigate, isLoading]);

  if (isLoading) return <div>Loading session...</div>;
  if (!session) return <div>Session not found</div>;

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4'>
      <ParticipantView session={session} />
    </div>
  );
};
