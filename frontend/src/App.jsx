import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import { AppRoutes } from './routes';

function App() {
  return (
    <ThemeProvider>
      <AppConfigProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AppConfigProvider>
    </ThemeProvider>
  );
}

export default App;
