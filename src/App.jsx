import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CurrentWeather from './pages/CurrentWeather.jsx';
import Historical from './pages/Historical.jsx';
import { useUserLocation } from './hooks/useUserLocation.js';
import './styles/App.css';

export default function App() {
  const { location, loading: locLoading } = useUserLocation();

  return (
    <div className="app">
      <Navbar city={location?.city} />

      {locLoading ? (
        <div className="app-loading">
          <div className="loader" />
          <p>Detecting your location…</p>
          <span>Please allow location access for localized data</span>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<CurrentWeather location={location} />} />
          <Route path="/historical" element={<Historical location={location} />} />
        </Routes>
      )}

      <footer className="app-footer">
        <div className="container">
          <span>WeatherSense · Powered by </span>
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo API</a>
          <span> · Data updates hourly</span>
        </div>
      </footer>
    </div>
  );
}
