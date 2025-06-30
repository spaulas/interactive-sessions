export const generateCode = () =>
  Math.random().toString(36).substr(2, 6).toUpperCase();
