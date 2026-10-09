import AppRoute from "./routes/AppRoute";
import AuthProvider from "./auth/AuthProvider";
import "./App.css";

function App() {
  return (
    <div>
      <AuthProvider>
        <AppRoute />
      </AuthProvider>
    </div>
  );
}

export default App;

