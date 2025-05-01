const apiKey = 'c76c8138cf7428c36b661f8c9d07c12d';
const weatherSection = document.getElementById('weather');
const cityInput = document.getElementById('cityInput');
const getWeatherButton = document.getElementById('getWeather');

getWeatherButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=uk`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    const temperature = data.main.temp;
                    const description = data.weather[0].description;
                    const icon = data.weather[0].icon;
                    const humidity = data.main.humidity;
                    const windSpeed = data.wind.speed;

                    weatherSection.innerHTML = `
                        <h2>${data.name}</h2>
                        <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${description}">
                        <p>Температура: ${temperature}°C</p>
                        <p>Опис: ${description}</p>
                        <p>Вологість: ${humidity}%</p>
                        <p>Швидкість вітру: ${windSpeed} м/с</p>
                    `;
                } else {
                    weatherSection.innerHTML = `<p>Місто не знайдено.</p>`;
                }
            })
            .catch(error => {
                weatherSection.innerHTML = `<p>Не вдалося отримати дані про погоду.</p>`;
                console.error('Помилка:', error);
            });
    } else {
        weatherSection.innerHTML = `<p>Будь ласка, введіть назву міста.</p>`;
    }
});