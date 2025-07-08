import React, { useContext, useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { KawaiiButton } from '../../../../../../common-ui/kawaii-button/KawaiiButton';
import { KawaiiInput } from '../../../../../../common-ui/kawaii-input/KawaiiInput';
import { AuthContext } from '../../../../../../auth-context/AuthContext';

export const ParticipantView: FC<{ session: Session }> = ({ session }) => {
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentQuestion = session.questions[session.currentQuestionIndex];

  // Reset answer state when the question changes (when admin navigates to next/prev question)
  useEffect(() => {
    if (currentQuestion && user) {
      // Check if the current user has already answered this specific question
      const userAnswer = currentQuestion.answers.find(
        (a) => a.userId === user.id
      );

      if (userAnswer) {
        // User has already answered this question, restore their answer
        setAnswer(userAnswer.answer);
        setHasAnswered(true);
      } else {
        // User hasn't answered this question yet, reset the state
        setAnswer(currentQuestion.type === 'multiple-choice' ? null : '');
        setHasAnswered(false);
      }
    }
  }, [session.currentQuestionIndex, user]); // Depend on currentQuestionIndex instead of answers

  // Alternative approach - if you want to reset whenever answers are cleared by admin
  // useEffect(() => {
  //   if (currentQuestion && currentQuestion.answers.length === 0) {
  //     setAnswer(currentQuestion.type === 'multiple-choice' ? null : '');
  //     setHasAnswered(false);
  //   }
  // }, [currentQuestion?.answers.length]);

  const submitAnswer = () => {
    if (answer === '' || answer === null || !user) return;

    const newAnswer: Answer = {
      userId: user.id,
      userName: user.name,
      answer,
      timestamp: Date.now(),
    };

    Meteor.call(
      'sessions.submitAnswer',
      session.id,
      session.currentQuestionIndex,
      newAnswer,
      (err: any) => {
        if (err) {
          console.error('Failed to submit answer', err);
          alert('Failed to submit answer, please try again.');
        } else {
          setHasAnswered(true);
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  useEffect(() => {
    return () => {
      console.log('REMOVE PARTICIPANT - user = ', user);
      console.log('REMOVE PARTICIPANT - session = ', session);
      if (user && session) {
        Meteor.call(
          'sessions.removeParticipant',
          session.id,
          user.id,
          (err) => {
            if (err) console.error('Failed to remove participant:', err);
          }
        );
      }
    };
  }, []);

  console.log(' answer = ', answer);

  if (!session.isActive) {
    return (
      <div className='max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center'>
        <h2 className='text-2xl font-bold text-purple-600 mb-4'>
          ⏳ Session Not Started
        </h2>
        <p className='text-gray-600 mb-6'>
          The session "{session.title}" hasn't started yet. Please wait for the
          admin to begin!
        </p>
        <KawaiiButton onClick={() => navigate('/')} variant='secondary'>
          🏠 Back Home
        </KawaiiButton>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className='max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center'>
        <h2 className='text-2xl font-bold text-purple-600 mb-4'>
          🎉 Session Complete!
        </h2>
        <p className='text-gray-600 mb-6'>
          Thanks for participating in "{session.title}"!
        </p>
        <KawaiiButton onClick={() => navigate('/')} variant='primary'>
          🏠 Back Home
        </KawaiiButton>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8'>
      <div className='text-center mb-6'>
        <h1 className='text-2xl font-bold text-purple-600 mb-2'>
          {session.title}
        </h1>
        <p className='text-sm text-gray-500'>
          Question {session.currentQuestionIndex + 1} of{' '}
          {session.questions.length}
        </p>
      </div>

      <div className='mb-6'>
        <h2 className='text-lg font-bold text-gray-800 mb-4'>
          {currentQuestion.question}
        </h2>

        {currentQuestion.type === 'multiple-choice' ? (
          <div className='space-y-2'>
            {currentQuestion.options?.map((option, index) =>
              option ? (
                <button
                  key={index}
                  onClick={() => setAnswer(index)}
                  disabled={hasAnswered}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    answer === index
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  } ${
                    hasAnswered
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-purple-50'
                  }`}
                >
                  {option}
                </button>
              ) : null
            )}
          </div>
        ) : (
          <KawaiiInput
            placeholder='Type your answer here... ✨'
            value={answer as string}
            onChange={setAnswer}
            onKeyPress={(e) =>
              handleKeyPress(
                e as unknown as React.KeyboardEvent<HTMLInputElement>
              )
            }
            autoFocus
            disabled={hasAnswered} // prevent typing after submission
          />
        )}
      </div>

      {!hasAnswered ? (
        <KawaiiButton
          onClick={submitAnswer}
          disabled={answer === null || answer === ''}
          className='w-full'
        >
          🚀 Submit Answer
        </KawaiiButton>
      ) : (
        <div className='text-center'>
          <div className='bg-green-100 text-green-800 p-4 rounded-xl mb-4'>
            ✅ Answer submitted! Waiting for results...
          </div>
          {currentQuestion.showWhoVoted && (
            <div className='text-sm text-gray-600'>
              Others who answered like you:{' '}
              {currentQuestion.answers
                .filter((a) => a.answer === answer && a.userId !== user?.id)
                .map((a) => a.userName)
                .join(', ') || 'None yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
