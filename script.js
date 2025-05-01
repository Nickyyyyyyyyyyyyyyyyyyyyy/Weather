const apiKey = 'c76c8138cf7428c36b661f8c9d07c12d';
const currentWeatherSection = document.getElementById('currentWeather');
const hourlyWeatherSection = document.getElementById('hourlyWeather');
const dailyWeatherSection = document.getElementById('dailyWeather');
const cityInput = document.getElementById('cityInput');
const getWeatherButton = document.getElementById('getWeather');
const background = document.getElementById('background');

getWeatherButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        // Поточна погода
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=uk`)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    const temperature = Math.round(data.main.temp);
                    const description = data.weather[0].description;
                    const icon = data.weather[0].icon;
                    const weatherMain = data.weather[0].main.toLowerCase();

                    // Зміна фону залежно від погоди
                    if (weatherMain.includes('clear')) {
                        background.style.background = 'linear-gradient(to bottom, #1E3A8A, #F59E0B)';
                    } else if (weatherMain.includes('clouds')) {
                        background.style.background = 'linear-gradient(to bottom, #1E3A8A, #6B7280)';
                    } else if (weatherMain.includes('rain')) {
                        background.style.background = 'linear-gradient(to bottom, #1E3A8A, #3B82F6)';
                    }

                    currentWeatherSection.innerHTML = `
                        <h2>${data.name}</h2>
                        <div class="temp">${temperature}°</div>
                        <div class="description">${description}</div>
                        <img src="http://openweathermap.org/img/wn/${icon}.png" alt="${description}">
                    `;
                } else {
                    currentWeatherSection.innerHTML = `<p>Місто не знайдено.</p>`;
                }
            })
            .catch(error => {
                currentWeatherSection.innerHTML = `<p>Не вдалося отримати дані про погоду.</p>`;
                console.error('Помилка:', error);
            });

        // Прогноз на 5 днів (погодинний і щоденний)
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=uk`)
            .then(response => response.json())
            .then(data => {
                if (data.cod === "200") {
                    // Погодинний прогноз (перші 5 годин)
                    hourlyWeatherSection.innerHTML = '';
                    for (let i = 0; i < 5; i++) {
                        const hourData = data.list[i];
                        const time = new Date(hourData.dt * 1000).getHours() + ':00';
                        const temp = Math.round(hourData.main.temp);
                        const icon = hourData.weather[0].icon;
                        hourlyWeatherSection.innerHTML += `
                            <div class="hourly-card">
                                <div>${time}</div>
                                <img src="http://openweathermap.org/img/wn/${icon}.png">
                                <div>${temp}°</div>
                            </div>
                        `;
                    }

                    // Щоденний прогноз (перші 5 днів)
                    dailyWeatherSection.innerHTML = '';
                    const dailyData = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);
                    dailyData.forEach(day => {
                        const date = new Date(day.dt * 1000);
                        const dayName = date.toLocaleDateString('uk', { weekday: 'short' });
                        const temp = Math.round(day.main.temp);
                        const icon = day.weather[0].icon;
                        dailyWeatherSection.innerHTML += `
                            <div class="daily-card">
                                <div>${dayName}</div>
                                <img src="http://openweathermap.org/img/wn/${icon}.png">
                                <div>${temp}°</div>
                            </div>
                        `;
                    });
                }
            })
            .catch(error => {
                hourlyWeatherSection.innerHTML = `<p>Не вдалося отримати прогноз.</p>`;
                dailyWeatherSection.innerHTML = `<p>Не вдалося отримати прогноз.</p>`;
                console.error('Помилка:', error);
            });
    } else {
        currentWeatherSection.innerHTML = `<p>Будь ласка, введіть назву міста.</p>`;
    }
});