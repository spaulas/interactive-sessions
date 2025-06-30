import type { FC } from 'react';
import React from 'react';

export const QuestionResults: FC<{ question: Question }> = ({ question }) => {
  const totalAnswers = question.answers.length;

  if (question.type === 'multiple-choice' && question.options) {
    const results = question.options.map((option, index) => {
      const count = question.answers.filter((a) => a.answer === index).length;
      const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
      const isCorrect = question.correctAnswer === index;

      return {
        option,
        count,
        percentage,
        isCorrect,
        voters: question.answers
          .filter((a) => a.answer === index)
          .map((a) => a.userName),
      };
    });

    return (
      <div>
        <h3 className='text-xl font-bold text-gray-800 mb-6 text-center'>
          📊 Results
        </h3>
        <div className='space-y-4'>
          {results.map((result, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 ${
                result.isCorrect && question.showCorrectAnswer
                  ? 'bg-green-100 border-2 border-green-300'
                  : 'bg-gray-100'
              }`}
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='font-medium'>
                  {String.fromCharCode(65 + index)}. {result.option}
                  {result.isCorrect && question.showCorrectAnswer && ' ✅'}
                </span>
                <span className='font-bold text-purple-600'>
                  {result.count} ({result.percentage.toFixed(1)}%)
                </span>
              </div>

              <div className='w-full bg-gray-200 rounded-full h-3 mb-2'>
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    result.isCorrect && question.showCorrectAnswer
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>

              {question.showWhoVoted && result.voters.length > 0 && (
                <div className='text-sm text-gray-600 mt-2'>
                  👥 {result.voters.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <h3 className='text-xl font-bold text-gray-800 mb-6 text-center'>
          💬 Open Text Answers
        </h3>
        <div className='space-y-3 max-h-96 overflow-y-auto'>
          {question.answers.map((answer, index) => (
            <div key={index} className='bg-gray-50 rounded-xl p-4'>
              <div className='font-medium text-purple-600 text-sm mb-1'>
                {question.showWhoVoted
                  ? answer.userName
                  : `Anonymous ${index + 1}`}
              </div>
              <div className='text-gray-800'>{answer.answer}</div>
            </div>
          ))}
          {question.answers.length === 0 && (
            <div className='text-center text-gray-500 py-8'>
              No answers yet... 🤔
            </div>
          )}
        </div>
      </div>
    );
  }
};
