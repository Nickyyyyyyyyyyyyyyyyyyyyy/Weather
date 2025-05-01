const apiKey = "c76c8138cf7428c36b661f8c9d07c12d";
const city = "Kyiv"; // Можна зробити динамічний вибір

async function fetchWeather() {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    const data = await response.json();
    
    document.getElementById("temperature").innerText = `Температура: ${data.main.temp}°C`;
    document.getElementById("description").innerText = `Опис: ${data.weather[0].description}`;
}

fetchWeather();