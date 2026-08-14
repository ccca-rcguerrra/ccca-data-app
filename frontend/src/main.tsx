import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './app.tsx';
import './styles/globals.css';

// Get the environment variable to determine if it's development or production
const isDev = import.meta.env.DEV;

// Define the app creation functions for development and production
const createDevApp = (content: React.ReactNode) => <StrictMode>{content}</StrictMode>;
const createProdApp = (content: React.ReactNode) => content;

// Create the app using the appropriate function based on the environment
const app = isDev ? createDevApp(<App />) : createProdApp(<App />);

// Render the app to the root element
createRoot(document.getElementById('root')!).render(app);
