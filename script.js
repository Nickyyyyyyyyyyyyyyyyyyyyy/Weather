const apiKey = "c76c8138cf7428c36b661f8c9d07c12d";
const city = "Kyiv";

async function fetchWeatherData() {
  const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
  const weatherData = await weatherRes.json();
  updateCurrentWeather(weatherData);

  const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
  const forecastData = await forecastRes.json();
  updateForecast(forecastData);
}

function updateCurrentWeather(data) {
  document.getElementById("city").textContent = data.name;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°`;
  document.getElementById("description").textContent = data.weather[0].description;

  const iconCode = data.weather[0].icon;
  document.getElementById("weather-icon").className = `wi ${getWeatherIcon(iconCode)}`;
}

function updateForecast(data) {
  const forecastContainer = document.getElementById("forecast-container");
  forecastContainer.innerHTML = "";

  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
  
  dailyData.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString('uk-UA', { weekday: 'short' });
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;
    
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("forecast-day");
    dayDiv.innerHTML = `<div class="day">${dayName}</div><div class="icon"><i class="wi ${getWeatherIcon(iconCode)}"></i></div><div class="temp">${temp}°</div>`;
    forecastContainer.appendChild(dayDiv);
  });
}

function getWeatherIcon(code) {
  const icons = {
    "01d": "wi-day-sunny", "01n": "wi-night-clear", "02d": "wi-day-cloudy", "02n": "wi-night-cloudy",
    "03d": "wi-cloud", "03n": "wi-cloud", "04d": "wi-cloudy", "04n": "wi-cloudy",
    "09d": "wi-showers", "09n": "wi-showers", "10d": "wi-day-rain", "10n": "wi-night-rain",
    "11d": "wi-thunderstorm", "11n": "wi-thunderstorm", "13d": "wi-snow", "13n": "wi-snow",
    "50d": "wi-fog", "50n": "wi-fog"
  };
  return icons[code] || "wi-day-sunny";
}

fetchWeatherData();