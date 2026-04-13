import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRoutes } from './routes';

function App() {
  return (
    <ThemeProvider>
      <AppConfigProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </AppConfigProvider>
    </ThemeProvider>
  );
}

export default App;
