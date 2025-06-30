import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import '/client/main.css';
import { App } from '../imports/ui/App';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  if (!container) {
    throw new Error("React root container 'react-target' not found");
  }
  const root = createRoot(container);
  root.render(<App />);
});
