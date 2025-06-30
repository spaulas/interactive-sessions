import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth-context/AuthContext';
import { KawaiiInput } from '../../common-ui/kawaii-input/KawaiiInput';
import { KawaiiButton } from '../../common-ui/kawaii-button/KawaiiButton';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { login, register, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isGuest) {
      console.log('name = ', name);
      if (!name.trim()) {
        setErrorMessage('Please enter a name');
        return;
      }
      loginAsGuest(name.trim());
      navigate('/');
      return;
    }

    if (isLogin) {
      const success = await login(email.trim(), password);
      if (success) {
        navigate('/');
      } else {
        setErrorMessage('Invalid email or password');
      }
    } else {
      if (!name.trim()) {
        setErrorMessage('Please enter your name');
        return;
      }

      const success = await register(name.trim(), email.trim(), password);
      if (success) {
        navigate('/');
      } else {
        setErrorMessage('Registration failed. Email may already be in use.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4'>
      <div className='bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-purple-600 mb-2'>
            ✨ Kawaii Slido ✨
          </h1>
          <p className='text-gray-600'>Connect with your team in a cute way!</p>
        </div>

        {/* Toggle Guest / Account */}
        <div className='flex mb-6 bg-gray-100 rounded-full p-1'>
          <button
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              !isGuest ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setIsGuest(false)}
          >
            Account
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              isGuest ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setIsGuest(true)}
          >
            Guest
          </button>
        </div>

        {/* Toggle Login / Register (only for account users) */}
        {!isGuest && (
          <div className='flex mb-4 bg-gray-100 rounded-full p-1'>
            <button
              type='button'
              className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
                isLogin ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type='button'
              className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
                !isLogin
                  ? 'bg-white shadow-md text-purple-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {(isGuest || !isLogin) && (
            <KawaiiInput
              placeholder='Your cute name 🌸'
              value={name}
              onChange={setName}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          )}

          {!isGuest && (
            <>
              <KawaiiInput
                placeholder='Email ✉️'
                type='email'
                value={email}
                onChange={setEmail}
                onKeyPress={handleKeyPress}
              />
              <KawaiiInput
                placeholder='Password 🔒'
                type='password'
                value={password}
                onChange={setPassword}
                onKeyPress={handleKeyPress}
              />
            </>
          )}

          {errorMessage && (
            <div className='text-red-500 text-sm text-center'>
              {errorMessage}
            </div>
          )}

          <KawaiiButton type='submit' className='w-full'>
            {isGuest
              ? '🚀 Join as Guest'
              : isLogin
              ? '🌟 Login'
              : '✨ Register'}
          </KawaiiButton>
        </form>
      </div>
    </div>
  );
};
