import type { FC } from 'react';
import React from 'react';

export const QuestionDisplay: FC<{
  question: Question;
  questionNumber: number;
}> = ({ question, questionNumber }) => {
  return (
    <div className='text-center'>
      <div className='mb-8'>
        <div className='text-sm text-purple-500 font-medium mb-2'>
          Question {questionNumber}
        </div>
        <h2 className='text-3xl font-bold text-gray-800 mb-6'>
          {question.question}
        </h2>
      </div>

      {question.type === 'multiple-choice' && question.options && (
        <div className='space-y-4'>
          {question.options.map((option, index) =>
            option ? (
              <div
                key={index}
                className='bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 text-lg font-medium text-gray-800'
              >
                {String.fromCharCode(65 + index)}. {option}
              </div>
            ) : null
          )}
        </div>
      )}

      {question.type === 'open-text' && (
        <div className='bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-8'>
          <div className='text-2xl'>💭</div>
          <p className='text-lg text-gray-700 mt-2'>
            Open text question - participants can type their answers
          </p>
        </div>
      )}
    </div>
  );
};
