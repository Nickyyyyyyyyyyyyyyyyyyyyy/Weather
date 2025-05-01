document.addEventListener('DOMContentLoaded', () => {
    console.log("Сторінка завантажена. Запит даних...");

    // --- Елементи DOM ---
    const locationElement = document.getElementById('location');
    const currentTempElement = document.getElementById('current-temp');
    const currentDescElement = document.getElementById('current-desc');
    const currentHighElement = document.getElementById('current-high');
    const currentLowElement = document.getElementById('current-low');
    const feelsLikeElement = document.getElementById('feels-like');
    const humidityElement = document.getElementById('humidity');
    const windElement = document.getElementById('wind');
    const pressureElement = document.getElementById('pressure');
    const hourlyScrollContainer = document.querySelector('.hourly-scroll');
    const dailyListContainer = document.querySelector('.daily-list');

    // --- API Налаштування ---
    // !!! ВАЖЛИВО: Замініть на ваш реальний ключ API !!!
    // !!! НЕБЕЗПЕЧНО ЗБЕРІГАТИ КЛЮЧ В КЛІЄНТСЬКОМУ КОДІ ДЛЯ ПРОДАКШЕНУ !!!
    const apiKey = 'c76c8138cf7428c36b661f8c9d07c12d'; // <-- ВАШ КЛЮЧ

    // --- Функції ---

    // Отримує поточну погоду
    function fetchCurrentWeather(cityName, key) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${key}&units=metric&lang=uk`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Помилка HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.cod === 200) {
                    updateCurrentWeather(data);
                    // Після успішного отримання поточної погоди, запитуємо прогноз
                    fetchForecastData(cityName, key);
                } else {
                    throw new Error(data.message || "Помилка отримання поточних даних.");
                }
            })
            .catch(handleFetchError);
    }

    // Отримує дані прогнозу (5 днів / 3 години)
    function fetchForecastData(cityName, key) {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${key}&units=metric&lang=uk`;

        fetch(forecastUrl)
            .then(response => {
                 if (!response.ok) {
                    throw new Error(`Помилка HTTP прогнозу: ${response.status}`);
                }
                return response.json();
            })
            .then(forecastData => {
                 if (forecastData.cod === "200") {
                    updateHourlyForecast(forecastData.list);
                    updateDailyForecast(forecastData.list);
                 } else {
                    throw new Error(forecastData.message || "Помилка формату даних прогнозу.");
                 }
            })
            .catch(error => {
                console.error("Помилка отримання або обробки прогнозу:", error);
                // Можна додати повідомлення користувачу про помилку завантаження прогнозу
                hourlyScrollContainer.innerHTML = '<p>Не вдалося завантажити погодинний прогноз.</p>';
                dailyListContainer.innerHTML = '<p>Не вдалося завантажити прогноз на дні.</p>';
            });
    }

    // Оновлює блок поточної погоди
    function updateCurrentWeather(data) {
        locationElement.textContent = data.name;
        currentTempElement.textContent = `${Math.round(data.main.temp)}°`;
        currentDescElement.textContent = data.weather[0].description;
        currentHighElement.textContent = `Макс: ${Math.round(data.main.temp_max)}°`;
        currentLowElement.textContent = `Мін: ${Math.round(data.main.temp_min)}°`;
        feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°`;
        humidityElement.textContent = `${data.main.humidity}%`;
        windElement.textContent = `${data.wind.speed.toFixed(1)} м/с`; // Округлення до 1 знаку
        pressureElement.textContent = `${data.main.pressure} гПа`;
        // Додатково: можна оновити іконку поточної погоди, якщо вона є в HTML
    }

    // Оновлює блок погодинного прогнозу (перші 8 записів = 24 години)
    function updateHourlyForecast(hourlyList) {
        hourlyScrollContainer.innerHTML = ''; // Очистити попередній вміст

        // Беремо перші 8 записів (на 24 години вперед з кроком 3 години)
        const next24Hours = hourlyList.slice(0, 8);

        next24Hours.forEach((item, index) => {
            const dateTime = new Date(item.dt * 1000); // Конвертуємо секунди в мс
            const hour = dateTime.getHours();
            const timeString = index === 0 ? "Зараз" : `${hour.toString().padStart(2, '0')}:00`; // Перший елемент - "Зараз"

            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;

            const hourItemDiv = document.createElement('div');
            hourItemDiv.classList.add('hour-item');
            hourItemDiv.innerHTML = `
                <div class="time">${timeString}</div>
                <div class="icon">${getWeatherIcon(iconCode)}</div>
                <div class="temp">${temp}°</div>
            `;
            hourlyScrollContainer.appendChild(hourItemDiv);
        });
    }

     // Оновлює блок денного прогнозу (агрегує дані з 3-годинних)
    function updateDailyForecast(list) {
        dailyListContainer.innerHTML = ''; // Очистити попередній вміст
        const dailySummaries = {};

        list.forEach(item => {
            const date = item.dt_txt
