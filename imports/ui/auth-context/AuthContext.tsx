import React, { createContext, useEffect, useState, useContext } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAsGuest: (name: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loginAsGuest: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tracker = Tracker.autorun(() => {
      if (Meteor.loggingIn()) {
        setLoading(true);
        return; // Don't update user while logging in
      }

      setLoading(false);

      const user = Meteor.user();
      if (user) {
        const profile = user.profile as {
          name?: string;
          isAdmin?: boolean;
          isGuest?: boolean;
        };

        setCurrentUser({
          id: user._id,
          name: profile?.name || user.username || 'Anonymous',
          email: user.emails?.[0]?.address,
          isAdmin: profile?.isAdmin || false,
          isGuest: profile?.isGuest || false,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => tracker.stop();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Meteor.loginWithPassword(email, password, (err) => {
        if (err) {
          console.error('Login failed', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      Accounts.createUser(
        {
          email,
          password,
          profile: {
            name,
            isAdmin: email.includes('admin'), // Basic rule, can be customized
          },
        },
        (err) => {
          if (err) {
            console.error('Registration failed', err);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  };

  const logout = () => {
    Meteor.logout();
  };

  const loginAsGuest = (name: string) => {
    // Local-only guest login
    setCurrentUser({
      id: Math.random().toString(36).substring(2),
      name,
      isAdmin: false,
      isGuest: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{ user: currentUser, login, register, logout, loginAsGuest }}
    >
      {/* Optionally show loading UI while logging in */}
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
