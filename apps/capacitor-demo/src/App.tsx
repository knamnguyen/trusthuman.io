import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { AppUrlListener } from './components/AppUrlListener';

export function App() {
  return (
    <BrowserRouter>
      <AppUrlListener />
      <AppRouter />
    </BrowserRouter>
  );
}
