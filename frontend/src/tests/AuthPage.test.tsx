import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import AuthPage from '../components/Auth/AuthPage';
import authReducer from '../store/slices/authSlice';
import projectReducer from '../store/slices/projectSlice';
import taskReducer from '../store/slices/taskSlice';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
  Toaster: () => null,
}));

// Mock axios
jest.mock('../api/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const makeStore = (preloadedState = {}) =>
  configureStore({
    reducer: { auth: authReducer, projects: projectReducer, tasks: taskReducer },
    preloadedState,
  });

const renderWithStore = (ui: React.ReactElement, store = makeStore()) =>
  render(<Provider store={store}><MemoryRouter>{ui}</MemoryRouter></Provider>);

// ---- TEST 1: AuthPage renders login form ----
describe('AuthPage', () => {
  it('renders login form by default', () => {
    renderWithStore(<AuthPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // ---- TEST 2: Switch to register form ----
  it('switches to register form when Sign up is clicked', () => {
    renderWithStore(<AuthPage />);
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByPlaceholderText('Syed Wasi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
