const apiKey = "c76c8138cf7428c36b661f8c9d07c12d";
const city = "Kyiv";  // Можна змінити або зробити динамічний вибір міста

async function fetchWeather() {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    if (!response.ok) throw new Error("Network response error");
    
    const data = await response.json();
    updateWeather(data);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

function updateWeather(data) {
  const temperatureElem = document.getElementById("temperature");
  const descriptionElem = document.getElementById("description");
  const cityElem = document.getElementById("city");
  
  // Оновлюємо дані
  cityElem.textContent = data.name;
  temperatureElem.textContent = `${Math.round(data.main.temp)}°`;
  descriptionElem.textContent = data.weather[0].description;
  
  // Оновлення погодної іконки
  const iconCode = data.weather[0].icon;
  document.getElementById("weather-icon").className = `wi ${getWeatherIcon(iconCode)}`;
  
  // Зміна фону залежно від основного типу погоди
  updateBackground(data.weather[0].main, iconCode);
}

function getWeatherIcon(code) {
  const icons = {
    "01d": "wi-day-sunny",
    "01n": "wi-night-clear",
    "02d": "wi-day-cloudy",
    "02n": "wi-night-cloudy",
    "03d": "wi-cloud",
    "03n": "wi-cloud",
    "04d": "wi-cloudy",
    "04n": "wi-cloudy",
    "09d": "wi-showers",
    "09n": "wi-showers",
    "10d": "wi-day-rain",
    "10n": "wi-night-rain",
    "11d": "wi-thunderstorm",
    "11n": "wi-thunderstorm",
    "13d": "wi-snow",
    "13n": "wi-snow",
    "50d": "wi-fog",
    "50n": "wi-fog"
  };
  return icons[code] || "wi-day-sunny";
}

function updateBackground(weatherMain, icon) {
  const background = document.querySelector(".background");
  let gradient = "";
  
  // Налаштування градієнту залежно від загальної погоди
  switch (weatherMain.toLowerCase()) {
    case "clear":
      gradient = icon.includes("d") ?
        "linear-gradient(135deg, #2980B9, #6DD5FA)" :  // денне небо
        "linear-gradient(135deg, #2C3E50, #4CA1AF)";   // нічне небо
      break;
    case "clouds":
      gradient = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
      break;
    case "rain":
    case "drizzle":
      gradient = "linear-gradient(135deg, #4B79A1, #283E51)";
      break;
    case "thunderstorm":
      gradient = "linear-gradient(135deg, #141E30, #243B55)";
      break;
    case "snow":
      gradient = "linear-gradient(135deg, #83a4d4, #b6fbff)";
      break;
    case "mist":
    case "smoke":
    case "haze":
    case "dust":
    case "fog":
      gradient = "linear-gradient(135deg, #757F9A, #D7DDE8)";
      break;
    default:
      gradient = "linear-gradient(135deg, #364F6B, #3FC1C9)";
  }
  
  background.style.background = gradient;
}

fetchWeather();