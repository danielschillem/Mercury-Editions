import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

function App() {
  return <h1>Hello Mercury</h1>;
}

describe('App', () => {
  it('renders hello message', () => {
    render(<App />);
    expect(screen.getByText('Hello Mercury')).toBeInTheDocument();
  });
});
