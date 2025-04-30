document.addEventListener('DOMContentLoaded', () => {
    console.log("Сторінка завантажена. Тут буде логіка для отримання даних про погоду.");

    // 1. Отримати місцезнаходження (поки беремо з HTML)
    const location = document.getElementById('location').textContent;

    // 2. Зробити запит до API погоди (OpenWeatherMap)
    const apiKey = 'c76c8138cf7428c36b661f8c9d07c12d';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=uk`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // 3. Оновити HTML з отриманими даними
            updateCurrentWeather(data);
        })
        .catch(error => {
            console.error("Помилка отримання даних про погоду:", error);
            alert("Не вдалося завантажити дані про погоду.");
        });

    // --- Функції для оновлення інтерфейсу ---
    function updateCurrentWeather(data) {
        document.getElementById('location').textContent = data.name;
        document.getElementById('current-temp').textContent = `${Math.round(data.main.temp)}°`;
        document.getElementById('current-desc').textContent = data.weather[0].description;
        document.getElementById('current-high').textContent = `Макс: ${Math.round(data.main.temp_max)}°`;
        document.getElementById('current-low').textContent = `Мін: ${Math.round(data.main.temp_min)}°`;
        document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('wind').textContent = `${data.wind.speed} м/с`;
        document.getElementById('pressure').textContent = `${data.main.pressure} гПа`;
        // Можна додати оновлення іконки погоди, якщо є відповідний елемент
    }

    function updateHourlyForecast(hourlyData) {
        // Логіка для генерації HTML для погодинного прогнозу
        const hourlyScroll = document.querySelector('.hourly-scroll');
        hourlyScroll.innerHTML = ''; // Очистити старі дані
        // Створити .hour-item для кожного запису в hourlyData та додати до hourlyScroll
    }

    function updateDailyForecast(dailyData) {
        // Логіка для генерації HTML для денного прогнозу
        const dailyList = document.querySelector('.daily-list');
        dailyList.innerHTML = ''; // Очистити старі дані
        // Створити .day-item для кожного запису в dailyData та додати до dailyList
    }
});