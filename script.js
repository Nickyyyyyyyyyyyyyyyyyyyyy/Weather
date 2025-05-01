const apiKey = "c76c8138cf7428c36b661f8c9d07c12d";
const city = "Kyiv";

async function fetchWeatherData() {
  try {
    // Отримуємо поточну погоду
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    const weatherData = await weatherResponse.json();
    updateCurrentWeather(weatherData);

    // Отримуємо прогноз погоди
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
    const forecastData = await forecastResponse.json();
    updateForecast(forecastData);
  } catch (error) {
    console.error("Помилка отримання даних:", error);
  }
}

function updateCurrentWeather(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°`;
  document.getElementById("description").textContent = data.weather[0].description;
  
  // Оновлюємо іконку погодних умов
  const iconCode = data.weather[0].icon;
  document.getElementById("weather-icon").className = `wi ${getWeatherIcon(iconCode)}`;
  
  // Змінюємо фон залежно від погоди
  updateBackground(data.weather[0].main, iconCode);
}

function updateForecast(data) {
  const forecastContainer = document.getElementById("forecast-container");
  forecastContainer.innerHTML = "";
  
  // Фільтруємо записи за часом "12:00:00", щоб отримати прогноз для кожного дня
  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
  
  dailyData.forEach(item => {
    const date = new Date(item.dt * 1000);
    const options = { weekday: 'short' };
    const dayName = date.toLocaleDateString('uk-UA', options);
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;
    
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("forecast-day");
    dayDiv.innerHTML = `
      <div class="day">${dayName}</div>
      <div class="icon"><i class="wi ${getWeatherIcon(iconCode)}"></i></div>
      <div class="temp">${temp}°</div>
    `;
    forecastContainer.appendChild(dayDiv);
  });
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
  
  // Налаштовуємо фон залежно від основного типу погоди
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
      gradient = "linear-gradient(135deg, #1E1E1E, #007AFF)";
  }
  
  background.style.background = gradient;
}

fetchWeatherData();