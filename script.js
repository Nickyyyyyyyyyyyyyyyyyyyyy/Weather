const apiKey = "c76c8138cf7428c36b661f8c9d07c12d";
const city = "Kyiv";

async function fetchWeather() {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    const data = await response.json();
    
    document.getElementById("temperature").innerText = `Температура: ${data.main.temp}°C`;
    document.getElementById("description").innerText = `Опис: ${data.weather[0].description}`;

    const iconCode = data.weather[0].icon;
    const iconClass = getWeatherIcon(iconCode);
    document.getElementById("weather-icon").className = `wi ${iconClass}`;
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
        "50n": "wi-fog",
    };
    return icons[code] || "wi-day-sunny";
}

fetchWeather();