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

    // --- Допоміжні функції ---

     /**
     * Повертає назву дня тижня
     * @param {Date} date - Об'єкт Date
     * @returns {string} Назва дня тижня (напр., "ПН")
     */
    function getDayName(date) {
        const days = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
        return days[date.getDay()];
    }

    /**
     * Повертає іконку погоди на основі коду OpenWeatherMap
     * !!! Потрібно замінити на SVG або icon font для кращого вигляду !!!
     * @param {string} iconCode - Код іконки від OpenWeatherMap (напр., '01d')
     * @returns {string} Емодзі або інший представник іконки
     */
    function getWeatherIcon(iconCode) {
        // Це базові емодзі. Рекомендовано використовувати повноцінний погодний шрифт або SVG-іконки.
        const iconMap = {
            '01d': '☀️', // Clear sky (day)
            '01n': '🌙', // Clear sky (night)
            '02d': '🌤️', // Few clouds (day)
            '02n': '☁️', // Few clouds (night)
            '03d': '☁️', // Scattered clouds
            '03n': '☁️', // Scattered clouds
            '04d': '☁️', // Broken clouds
            '04n': '☁️', // Broken clouds
            '09d': '🌧️', // Shower rain (day)
            '09n': '🌧️', // Shower rain (night)
            '10d': '🌦️', // Rain (day)
            '10n': '🌧️', // Rain (night)
            '11d': '⛈️', // Thunderstorm (day)
            '11n': '⛈️', // Thunderstorm (night)
            '13d': '❄️', // Snow (day)
            '13n': '❄️', // Snow (night)
            '50d': '🌫️', // Mist (day)
            '50n': '🌫️'  // Mist (night)
        };
        return iconMap[iconCode] || '❓'; // Повертає іконку або знак питання, якщо код невідомий
    }


    // --- Функції отримання та оновлення UI ---

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
                errorMessage += `: ${errorData.message}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    }

     /**
     * Розраховує мінімальну та максимальну температуру для поточного календарного дня з масиву прогнозу.
     * Використовує температуру (`temp`) з кожного 3-годинного запису в межах дня.
     * @param {Array} forecastList - Масив 'list' з /forecast API
     * @returns {{min: number|null, max: number|null}} - Об'єкт з мінімальною та максимальною температурою дня або null
     */
    function getCurrentDayMinMax(forecastList) {
        if (!forecastList || forecastList.length === 0) {
            return { min: null, max: null };
        }

        // Визначаємо дату першого запису прогнозу - це наш "поточний день" для фільтрації
        const firstForecastDate = new Date(forecastList[0].dt * 1000);
        const targetDay = firstForecastDate.getDate();
        const targetMonth = firstForecastDate.getMonth();
        const targetYear = firstForecastDate.getFullYear();

        // Фільтруємо записи, що належать до цього ж календарного дня
        const currentDayForecasts = forecastList.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate.getDate() === targetDay &&
                   itemDate.getMonth() === targetMonth &&
                   itemDate.getFullYear() === targetYear;
        });

        if (currentDayForecasts.length === 0) {
             console.warn("Не знайдено записів прогнозу для поточного дня.");
             return { min: null, max: null };
        }

        // Знаходимо мінімальну та максимальну температуру серед відфільтрованих записів
        let minTemp = Infinity;
        let maxTemp = -Infinity;

        currentDayForecasts.forEach(item => {
             // Використовуємо item.main.temp, оскільки temp_min/temp_max в прогнозних записах
             // зазвичай стосуються діапазону протягом 3-годинного вікна, а не дня загалом.
             minTemp = Math.min(minTemp, item.main.temp);
             maxTemp = Math.max(maxTemp, item.main.temp);
        });

        return {
            min: minTemp === Infinity ? null : Math.round(minTemp),
            max: maxTemp === -Infinity ? null : Math.round(maxTemp)
        };
    }

    /**
     * Встановлює клас на елементі body для зміни фонового градієнта відповідно до погоди.
     * @param {string} weatherMain - Головний опис погоди (напр., 'Clear', 'Clouds', 'Rain')
     */
    function setWeatherBackground(weatherMain) {
        const body = document.body;
        // Видаляємо всі попередні погодні класи
        body.className = body.className.split(' ').filter(cls => !cls.startsWith('weather-')).join(' ');

        // Додаємо новий клас відповідно до погоди
        let weatherClass = '';
        if (!weatherMain) {
             weatherClass = 'weather-default'; // Якщо погода не визначена
        } else {
            switch (weatherMain.toLowerCase()) {
                case 'clear':
                    weatherClass = 'weather-clear';
                    break;
                case 'clouds':
                    weatherClass = 'weather-clouds';
                    break;
                case 'rain':
                case 'drizzle':
                    weatherClass = 'weather-rain';
                    break;
                case 'thunderstorm':
                    weatherClass = 'weather-thunderstorm';
                    break;
                case 'snow':
                    weatherClass = 'weather-snow';
                    break;
                case 'mist':
                case 'smoke':
                case 'haze':
                case 'dust':
                case 'fog':
                case 'sand':
                case 'ash':
                case 'squall':
                case 'tornado':
                    weatherClass = 'weather-atmosphere';
                    break;
                default:
                    weatherClass = 'weather-default'; // Для інших умов
            }
        }

        if (weatherClass) {
            body.classList.add(weatherClass);
        }
        console.log(`Встановлено клас фону погоди: ${weatherClass}`);
    }


    /**
     * Оновлює блок погодинного прогнозу
     * @param {Array} hourlyList - Масив 'list' з /forecast API
     */
    function updateHourlyForecastUI(hourlyList) {
        hourlyScrollContainer.innerHTML = ''; // Очистити
        hourlyErrorElement.style.display = 'none'; // Сховати помилку
        hourlyLoadingElement.style.display = 'none'; // Сховати завантаження

        // Виводимо перші 8 записів (приблизно 24 години)
        const next24Hours = hourlyList.slice(0, 8);

        if (!next24Hours || next24Hours.length === 0) {
            showError(hourlyErrorElement, "Немає даних для погодинного прогнозу.");
            return;
        }


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


        // 1. Агрегувати дані по днях (з 3-годинних записів)
        const dailySummaries = {};
        let overallMinTemp = Infinity;
        let overallMaxTemp = -Infinity;

        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0]; // Отримуємо дату "YYYY-MM-DD"
            const temp = item.main.temp;

            if (!dailySummaries[date]) {
                dailySummaries[date] = {
                    temps: [], // Температури всіх записів за день
                    icons: [], // Іконки всіх записів за день
                    dt: item.dt // Timestamp першого запису дня (для отримання назви дня)
                };
            }
            dailySummaries[date].temps.push(temp);
            dailySummaries[date].icons.push(item.weather[0].icon);

            // Оновлюємо загальний мін/макс для шкали бару
            if (temp < overallMinTemp) overallMinTemp = temp;
            if (temp > overallMaxTemp) overallMaxTemp = temp;
        });

        // 2. Визначаємо загальний діапазон температур для масштабування смужки
        const overallTempRange = overallMaxTemp - overallMinTemp;

        // 3. Створюємо HTML для кожного дня
        // Пропускаємо перший день, оскільки його мін/макс ми відображаємо окремо в головному блоці
        // Або можемо включити його, але тоді в головному блоці показувати "Прогноз на сьогодні"
        // Давайте включимо всі дні з прогнозу, включаючи перший.
        // Ключі dailySummaries - це відсортовані дати завдяки формату 'YYYY-MM-DD'

        Object.keys(dailySummaries).forEach((date, index) => {
            const dayData = dailySummaries[date];
            const minTemp = Math.round(Math.min(...dayData.temps));
            const maxTemp = Math.round(Math.max(...dayData.temps));

            // Вибираємо іконку для середини дня або найчастішу
            // Простий підхід: беремо іконку з запису, найближчого до 12:00 або з середини масиву
            const middayIcon = dayData.icons[Math.floor(dayData.icons.length / 2)] || dayData.icons[0];
            const dayName = index === 0 ? "Сьогодні" : getDayName(new Date(dayData.dt * 1000));


            // Розрахунок для смужки температури відносно загального діапазону всіх днів
            let offsetPercent = 0;
            let widthPercent = 5; // Мінімальна ширина для видимості смужки
            if (overallTempRange > 0) { // Уникнути ділення на нуль
                 offsetPercent = ((minTemp - overallMinTemp) / overallTempRange) * 100;
                 widthPercent = ((maxTemp - minTemp) / overallTempRange) * 100;
            }
             // Обмеження значень від 0 до 100 та забезпечення мінімальної ширини
            offsetPercent = Math.max(0, offsetPercent);
            offsetPercent = Math.min(offsetPercent, 100 - widthPercent); // Щоб смужка не виходила за межі

            widthPercent = Math.max(5, widthPercent); // Мінімум 5% ширини
             widthPercent = Math.min(widthPercent, 100); // Максимум 100%

             // Якщо min == max і overallTempRange > 0, widthPercent може бути 0. Встановлюємо мін.
             if (minTemp === maxTemp && overallTempRange > 0) widthPercent = 5;


            const dayItemLi = document.createElement('li');
            dayItemLi.className = 'day-item';
            dayItemLi.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="icon">${getWeatherIcon(middayIcon)}</div>
                <div class="low-temp">${minTemp}°</div>
                <div class="temp-bar">
                    <div class="temp-range" style="width: ${widthPercent}%; margin-left: ${offsetPercent}%;"></div>
                </div>
                <div class="high-temp">${maxTemp}°</div>
            `;
            dailyListContainer.appendChild(dayItemLi);
        });
    }


    /**
     * Виконує запити до API та оновлює весь інтерфейс для заданого міста
     * @param {string} city - Назва міста
     */
    async function updateWeatherForCity(city) {
        console.log(`Оновлення погоди для: ${city}`);

        // Скидаємо UI та показуємо індикатори завантаження
        showLoading();
        hideErrors(); // Приховуємо попередні помилки при новому пошуку


        try {
            // 1. Отримуємо поточну погоду
            const currentWeather = await fetchWeatherData('weather', `q=${city}`);
            console.log("Поточна погода:", currentWeather);

            // 2. Отримуємо прогноз на 5 днів (з 3-годинним інтервалом)
            const forecast = await fetchWeatherData('forecast', `q=${city}`);
            console.log("Прогноз:", forecast);
            const forecastList = forecast.list; // Масив з 3-годинними записами

            // --- Оновлення секції поточної погоди ---

            // Розраховуємо мінімальну та максимальну температуру для поточного календарного дня з даних прогнозу
            const currentDayTemps = getCurrentDayMinMax(forecastList);

            // Оновлюємо UI використовуючи дані з currentWeather API та розраховані min/max дня з прогнозу
            locationElement.textContent = currentWeather.name;
            currentTempElement.textContent = `${Math.round(currentWeather.main.temp)}°`;
            currentDescElement.textContent = currentWeather.weather[0].description;
            feelsLikeElement.textContent = `${Math.round(currentWeather.main.feels_like)}°`;
            humidityElement.textContent = `${currentWeather.main.humidity}%`;
            windElement.textContent = `${currentWeather.wind.speed.toFixed(1)} м/с`;
            pressureElement.textContent = `${currentWeather.main.pressure} гПа`;

            // Використовуємо розраховані min/max дня з прогнозу, якщо вони доступні.
            // Якщо ні (наприклад, порожній список прогнозу), використовуємо min/max з поточного запису погоди (це може бути не точний максимум/мінімум дня, але це хоч якісь дані).
            currentHighElement.textContent = `Макс: ${currentDayTemps.max !== null ? currentDayTemps.max : Math.round(currentWeather.main.temp_max)}°`;
            currentLowElement.textContent = `Мін: ${currentDayTemps.min !== null ? currentDayTemps.min : Math.round(currentWeather.main.temp_min)}°`;


            // Встановлюємо фоновий градієнт відповідно до поточної погоди
            setWeatherBackground(currentWeather.weather[0].main);


            // --- Оновлення секції погодинного прогнозу ---
            updateHourlyForecastUI(forecastList);


            // --- Оновлення секції денного прогнозу ---
            updateDailyForecastUI(forecastList);


        } catch (error) {
            console.error("Помилка під час оновлення погоди:", error);
            // Показуємо повідомлення про помилку у відповідних секціях
            showError(currentErrorElement, error.message);
            // Очищаємо інші секції та показуємо помилки завантаження для них
            resetUI(); // Очистити попередні дані
            showError(hourlyErrorElement, "Не вдалося завантажити погодинний прогноз.");
            showError(dailyErrorElement, "Не вдалося завантажити денний прогноз.");
            // Приховуємо індикатори завантаження, бо сталася помилка
            hideLoading();

            // Скидаємо фон до дефолтного при помилці
            setWeatherBackground('');

        } finally {
            // В кінці приховуємо всі індикатори завантаження
            hideLoading();
        }
    }

    // --- Допоміжні функції для керування станом UI ---

    function showLoading() {
         // Приховуємо попередні дані та помилки перед показом завантаження
        resetUI();
        hideErrors();

        hourlyLoadingElement.style.display = 'block';
        dailyLoadingElement.style.display = 'block';
         // Можна також показати глобальний індикатор завантаження, якщо є
    }

    function hideLoading() {
        hourlyLoadingElement.style.display = 'none';
        dailyLoadingElement.style.display = 'none';
         // Приховуємо глобальний індикатор, якщо є
    }

    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    function hideErrors() {
        currentErrorElement.style.display = 'none';
        hourlyErrorElement.style.display = 'none';
        dailyErrorElement.style.display = 'none';
    }

    function resetUI() {
        // Скидає основні елементи UI до початкового стану
        locationElement.textContent = '--';
        currentTempElement.textContent = '-°';
        currentDescElement.textContent = 'Завантаження...'; // Або 'Немає даних'
        currentHighElement.textContent = 'Макс: -°';
        currentLowElement.textContent = 'Мін: -°';
        feelsLikeElement.textContent = '-°';
        humidityElement.textContent = '-%';
        windElement.textContent = '- м/с';
        pressureElement.textContent = '- гПа';
        hourlyScrollContainer.innerHTML = ''; // Очищає погодинний прогноз
        dailyListContainer.innerHTML = ''; // Очищає денний прогноз
         // Встановлюємо фон за замовчуванням
        setWeatherBackground('');
    }


    // --- Обробники подій ---

    // Обробка відправки 