document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM завантажено. Ініціалізація додатку...");

    // --- API Налаштування ---
    // !!! ВАЖЛИВО: Замініть на ваш реальний ключ API !!!
    // !!! НЕБЕЗПЕЧНО ЗБЕРІГАТИ КЛЮЧ В КЛІЄНТСЬКОМУ КОДІ ДЛЯ ПРОДАКШЕНУ !!!
    const API_KEY = 'c76c8138cf7428c36b661f8c9d07c12d'; // <-- ВАШ КЛЮЧ
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

    const hourlyLoadingElement = document.getElementById('hourly-loading');
    const hourlyErrorElement = document.getElementById('hourly-error');
    const hourlyScrollContainer = document.getElementById('hourly-scroll-container');

    const dailyLoadingElement = document.getElementById('daily-loading');
    const dailyErrorElement = document.getElementById('daily-error');
    const dailyListContainer = document.getElementById('daily-list-container');

    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const currentErrorElement = document.getElementById('current-error');

    // --- Функції ---

    /**
     * Універсальна функція для виконання запитів до API
     * @param {string} endpoint - Ендпоінт API (напр., 'weather', 'forecast')
     * @param {string} query - Параметр запиту (напр., місто 'q=Kyiv')
     * @returns {Promise<object>} - Об'єкт з даними API або викидає помилку
     */
    async function fetchWeatherData(endpoint, query) {
        const url = `${BASE_URL}/${endpoint}?${query}&appid=${API_KEY}&units=metric&lang=uk`;
        console.log(`Запит до API: ${url}`); // Для налагодження

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Спробувати отримати тіло помилки
            console.error("Помилка API:", response.status, errorData);
            let errorMessage = `Помилка HTTP: ${response.status}`;
            if (response.status === 401) {
                errorMessage = "Помилка: Невірний або неактивний API ключ.";
            } else if (response.status === 404) {
                errorMessage = "Помилка: Місто не знайдено.";
            } else if (response.status === 429) {
                errorMessage = "Помилка: Перевищено ліміт запитів до API.";
            } else if (errorData.message) {
                errorMessage += ` (${errorData.message})`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    /**
     * Оновлює блок поточної погоди
     * @param {object} data - Дані з /weather API
     */
    function updateCurrentWeatherUI(data) {
        locationElement.textContent = data.name;
        currentTempElement.textContent = `${Math.round(data.main.temp)}°`;
        currentDescElement.textContent = data.weather[0].description;
        currentHighElement.textContent = `Макс: ${Math.round(data.main.temp_max)}°`;
        currentLowElement.textContent = `Мін: ${Math.round(data.main.temp_min)}°`;
        feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°`;
        humidityElement.textContent = `${data.main.humidity}%`;
        windElement.textContent = `${data.wind.speed.toFixed(1)} м/с`;
        pressureElement.textContent = `${data.main.pressure} гПа`;
        currentErrorElement.textContent = ''; // Очистити попередні помилки
        currentErrorElement.style.display = 'none';
    }

    /**
     * Оновлює блок погодинного прогнозу
     * @param {Array} hourlyList - Масив 'list' з /forecast API
     */
    function updateHourlyForecastUI(hourlyList) {
        hourlyScrollContainer.innerHTML = ''; // Очистити
        hourlyErrorElement.style.display = 'none'; // Сховати помилку
        hourlyLoadingElement.style.display = 'none'; // Сховати завантаження

        if (!hourlyList || hourlyList.length === 0) {
            showError(hourlyErrorElement, "Немає даних для погодинного прогнозу.");
            return;
        }

        const next24Hours = hourlyList.slice(0, 8); // Перші 8 записів (24 години)

        next24Hours.forEach((item, index) => {
            const dateTime = new Date(item.dt * 1000);
            const hour = dateTime.getHours();
            const timeString = index === 0 ? "Зараз" : `${hour.toString().padStart(2, '0')}:00`;
            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;

            const hourItemDiv = document.createElement('div');
            hourItemDiv.className = 'hour-item';
            hourItemDiv.innerHTML = `
                <div class="time">${timeString}</div>
                <div class="icon">${getWeatherIcon(iconCode)}</div>
                <div class="temp">${temp}°</div>
            `;
            hourlyScrollContainer.appendChild(hourItemDiv);
        });
    }

    /**
     * Оновлює блок денного прогнозу
     * @param {Array} list - Масив 'list' з /forecast API
     */
    function updateDailyForecastUI(list) {
        dailyListContainer.innerHTML = ''; // Очистити
        dailyErrorElement.style.display = 'none'; // Сховати помилку
        dailyLoadingElement.style.display = 'none'; // Сховати завантаження

        if (!list || list.length === 0) {
            showError(dailyErrorElement, "Немає даних для денного прогнозу.");
            return;
        }

        // 1. Агрегувати дані по днях
        const dailySummaries = {};
        let overallMinTemp = Infinity;
        let overallMaxTemp = -Infinity;

        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            const temp = item.main.temp;

            if (!dailySummaries[date]) {
                dailySummaries[date] = {
                    temps: [],
                    icons: [],
                    dt: item.dt // Зберігаємо timestamp першого запису дня
                };
            }
            dailySummaries[date].temps.push(temp);
            dailySummaries[date].icons.push(item.weather[0].icon);

            // Оновлюємо загальний мін/макс для шкали
            if (temp < overallMinTemp) overallMinTemp = temp;
            if (temp > overallMaxTemp) overallMaxTemp = temp;
        });

        // 2. Створити HTML для кожного дня
        const overallTempRange = overallMaxTemp - overallMinTemp; // Загальний діапазон температур

        for (const date in dailySummaries) {
            const dayData = dailySummaries[date];
            const minTemp = Math.round(Math.min(...dayData.temps));
            const maxTemp = Math.round(Math.max(...dayData.temps));

            // Вибираємо іконку для середини дня (близько 12:00-15:00) або найчастішу
            const middayIcon = dayData.icons[Math.floor(dayData.icons.length / 2)] || dayData.icons[0];
            const dayName = getDayName(new Date(dayData.dt * 1000));

            // Розрахунок для смужки температури відносно загального діапазону
            let offsetPercent = 0;
            let widthPercent = 10; // Мінімальна ширина для видимості
            if (overallTempRange > 0) { // Уникнути ділення на нуль
                 offsetPercent = ((minTemp - overallMinTemp) / overallTempRange) * 100;
                 widthPercent = ((maxTemp - minTemp) / overallTempRange) * 100;
            }
             // Обмеження значень від 0 до 100
            offsetPercent = Math.max(0, Math.min(100 - widthPercent, offsetPercent));
            widthPercent = Math.max(5, Math.min(100, widthPercent)); // мін. 5% ширини

            const dayItemLi = document.createElement('li');
            dayItemLi.className = 'day-item';
            dayItemLi.innerHTML = `
                <span class="day-name">${dayName}</span>
                <span class="icon">${getWeatherIcon(middayIcon)}</span>
                <span class="low-temp">${minTemp}°</span>
                <div class="temp-bar">
                     <div class="temp-range" style="margin-left: ${offsetPercent.toFixed(1)}%; width: ${widthPercent.toFixed(1)}%;"></div>
                </div>
                <span class="high-temp">${maxTemp}°</span>
            `;
            dailyListContainer.appendChild(dayItemLi);
        }
    }

    /**
     * Отримує коротку назву дня тижня
     * @param {Date} date - Об'єкт Date
     * @returns {string} - "Сьогодні" або скорочена назва дня (Пн, Вт, ...)
     */
    function getDayName(date) {
        const today = new Date();
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            return "Сьогодні";
        }
        const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[date.getDay()];
    }

    /**
     * Повертає символ Unicode для іконки погоди
     * @param {string} iconCode - Код іконки від OpenWeatherMap
     * @returns {string} - Символ іконки
     */
    function getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': '☀️', '01n': '🌙', '02d': '🌤️', '02n': '☁️',
            '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️',
        };
        return iconMap[iconCode] || '❓';
    }

    /**
     * Показує повідомлення про помилку в заданому елементі
     * @param {HTMLElement} element - Елемент для відображення помилки
     * @param {string} message - Текст помилки
     */
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
         // Також показуємо помилку в головному блоці, якщо це помилка поточних даних
         if (element === currentErrorElement || !element) {
             currentErrorElement.textContent = message;
             currentErrorElement.style.display = 'block';
         }
    }

    /**
      * Головна функція для завантаження та відображення всієї погоди
      * @param {string} city - Назва міста
      */
    async function loadWeather(city) {
        console.log(`Завантаження погоди для: ${city}`);
        // Показати індикатори завантаження, сховати помилки
        currentErrorElement.style.display = 'none';
        hourlyLoadingElement.style.display = 'block';
        hourlyErrorElement.style.display = 'none';
        dailyLoadingElement.style.display = 'block';
        dailyErrorElement.style.display = 'none';
        hourlyScrollContainer.innerHTML = ''; // Очистити старі дані
        dailyListContainer.innerHTML = ''; // Очистити старі дані

        try {
            // 1. Завантажити поточну погоду
            const currentData = await fetchWeatherData('weather', `q=${city}`);
            updateCurrentWeatherUI(currentData);

            // 2. Завантажити прогноз (після успішного завантаження поточної)
            try { // Окремий try/catch для прогнозу, щоб помилка тут не зупинила показ поточної погоди
                 const forecastData = await fetchWeatherData('forecast', `q=${city}`);
                 updateHourlyForecastUI(forecastData.list);
                 updateDailyForecastUI(forecastData.list);
            } catch (forecastError) {
                 console.error("Помилка завантаження прогнозу:", forecastError);
                 showError(hourlyErrorElement, `Помилка прогнозу: ${forecastError.message}`);
                 showError(dailyErrorElement, `Помилка прогнозу: ${forecastError.message}`);
                 hourlyLoadingElement.style.display = 'none';
                 dailyLoadingElement.style.display = 'none';
            }

        } catch (error) {
            console.error("Головна помилка завантаження:", error);
            // Сховати індикатори
            hourlyLoadingElement.style.display = 'none';
            dailyLoadingElement.style.display = 'none';
            // Показати помилку в основному блоці та в блоках прогнозу
            showError(currentErrorElement, error.message);
            showError(hourlyErrorElement, "Не вдалося завантажити дані.");
            showError(dailyErrorElement, "Не вдалося завантажити дані.");
            // Можна скинути деякі поля до стану за замовчуванням
            locationElement.textContent = "Помилка";
            currentTempElement.textContent = "-°";
            currentDescElement.textContent = "";
        }
    }

    // --- Обробники подій ---
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Заборонити стандартну відправку форми
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            loadWeather(searchTerm);
            // searchInput.value = ''; // Очистити поле після пошуку (опціонально)
        } else {
            showError(currentErrorElement, "Будь ласка, введіть назву міста.");
        }
    });

    // --- Початковий запуск ---
    const initialCity = "Вінниця"; // Або можна взяти з геолокації чи іншого джерела
    searchInput.value = initialCity; // Встановити початкове місто в полі пошуку
    loadWeather(initialCity);

});
