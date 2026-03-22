import { useState, useEffect } from 'react';
import { getCityName } from '../utils/api';

export function useUserLocation() {
  const [location, setLocation] = useState(null); // { lat, lon, city }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback to Delhi if GPS not available
      getCityName(28.6139, 77.2090).then(city => {
        setLocation({ lat: 28.6139, lon: 77.2090, city });
        setLoading(false);
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const city = await getCityName(lat, lon);
          setLocation({ lat, lon, city });
        } catch {
          setLocation({ lat, lon, city: 'Your Location' });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('GPS denied, using Delhi fallback:', err.message);
        // Default fallback: New Delhi
        getCityName(28.6139, 77.2090).then(city => {
          setLocation({ lat: 28.6139, lon: 77.2090, city });
          setLoading(false);
        });
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  return { location, loading, error };
}
