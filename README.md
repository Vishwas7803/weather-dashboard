# 🌤 WeatherSense – Weather Dashboard

A responsive, real-time weather dashboard built with **React + Vite**, powered by the **Open-Meteo API** (free, no API key required).

## ✨ Features

### Page 1: Current Weather & Hourly Forecast
- 📍 **Auto GPS detection** — detects your location on load (falls back to New Delhi)
- 📅 **Calendar date picker** — view weather for any past/present date
- 🌡️ **Temperature toggle** — switch between °C and °F
- **Individual weather stats**: Temp (Min/Max/Current), Humidity, Precipitation, UV Index, Sunrise/Sunset, Max Wind Speed, Precipitation Probability
- **Air Quality Metrics**: AQI, PM10, PM2.5, CO, CO₂, NO₂, SO₂
- **6 Hourly charts** with scroll + zoom (Brush):
  - Temperature (°C/°F toggle)
  - Relative Humidity
  - Precipitation
  - Visibility
  - Wind Speed (10m)
  - PM10 & PM2.5 (combined)

### Page 2: Historical Data (up to 2 years)
- 📆 Date range picker (max 2-year span enforced)
- **Historical charts** with scroll + zoom:
  - Temperature (Mean, Max, Min)
  - Sun Cycle (Sunrise & Sunset in IST)
  - Precipitation totals
  - Max Wind Speed
  - PM10 & PM2.5 daily averages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router DOM | Client-side routing |
| Recharts | Charts & visualizations |
| date-fns | Date formatting |
| react-datepicker | Calendar UI |
| Open-Meteo API | Weather data (free, no key) |
| Nominatim API | Reverse geocoding |

## 📡 APIs Used

- **Open-Meteo Forecast**: `https://api.open-meteo.com/v1/forecast`
- **Open-Meteo Archive**: `https://api.open-meteo.com/v1/archive`
- **Open-Meteo Air Quality**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Nominatim** (OpenStreetMap): Reverse geocoding for city name

> ⚠️ CO₂ is not available from Open-Meteo. A global average (~420 ppm) is displayed as a placeholder.

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx / .css
│   ├── StatCard.jsx / .css
│   ├── HourlyChart.jsx / .css
│   └── DateSelector.jsx / .css
├── hooks/
│   └── useUserLocation.js
├── pages/
│   ├── CurrentWeather.jsx / .css
│   └── Historical.jsx / .css
├── styles/
│   ├── index.css
│   └── App.css
├── utils/
│   └── api.js
├── App.jsx
└── main.jsx
```

## 🌐 Deployment

You can deploy to **Vercel** for free:

```bash
npm install -g vercel
vercel
```

Or deploy to **Netlify** by uploading the `dist/` folder after `npm run build`.

---

Built for the **Selection Test: Weather Dashboard** requirement.
