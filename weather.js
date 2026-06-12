const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const contentDiv = document.getElementById('content');
const bgContainer = document.querySelector('.bg-container');

// Demo weather data for testing
const demoWeatherData = {
    sunny: {
        location: 'Sunny City, Demo Country',
        temp: 28,
        feelsLike: 30,
        description: 'Sunny',
        humidity: 45,
        windSpeed: 12,
        gradient: 'bg-sunny',
        isDemo: true
    },
    rainy: {
        location: 'Rainy Town, Demo Country',
        temp: 18,
        feelsLike: 16,
        description: 'Light Rain',
        humidity: 85,
        windSpeed: 25,
        gradient: 'bg-rainy',
        isDemo: true
    },
    cloudy: {
        location: 'Cloudy Village, Demo Country',
        temp: 22,
        feelsLike: 21,
        description: 'Overcast',
        humidity: 65,
        windSpeed: 15,
        gradient: 'bg-cloudy',
        isDemo: true
    },
    snowy: {
        location: 'Snowy Peak, Demo Country',
        temp: -5,
        feelsLike: -10,
        description: 'Heavy Snow',
        humidity: 75,
        windSpeed: 35,
        gradient: 'bg-snow',
        isDemo: true
    },
    storm: {
        location: 'Thunderstorm Zone, Demo Country',
        temp: 20,
        feelsLike: 15,
        description: 'Thunderstorm',
        humidity: 95,
        windSpeed: 45,
        gradient: 'bg-thunderstorm',
        isDemo: true
    }
};

function displayWeather(data) {
    bgContainer.className = `bg-container ${data.gradient}`;

    let demoIndicator = '';
    if (data.isDemo) {
        demoIndicator = '<div class="demo-badge">📋 Demo Data</div>';
    }

    contentDiv.innerHTML = `
        <div class="weather-main">
            <div class="location-name">${data.location}</div>

            <div class="temperature">
                <span>${data.temp}</span>
                <span class="temp-unit">°C</span>
            </div>

            <div class="weather-description">${data.description}</div>

            <div class="feels-like">
                Feels like ${data.feelsLike}°C
            </div>

            ${demoIndicator}
        </div>

        <div class="details-grid">
            <div class="detail-card">
                <div class="detail-label">Humidity</div>
                <div class="detail-value">${data.humidity}%</div>
            </div>

            <div class="detail-card">
                <div class="detail-label">Wind Speed</div>
                <div class="detail-value">${data.windSpeed} km/h</div>
            </div>

            <div class="detail-card">
                <div class="detail-label">Temperature</div>
                <div class="detail-value">${data.temp}°C</div>
            </div>

            <div class="detail-card">
                <div class="detail-label">Feels Like</div>
                <div class="detail-value">${data.feelsLike}°C</div>
            </div>
        </div>
    `;
}

function displayError(message) {
    contentDiv.innerHTML = `
        <div class="error">
            <div class="error-title">⚠️ Network Issue</div>

            <div class="error-message">
                ${message}
            </div>

            <div class="error-solutions">
                <strong>Try these demo locations instead:</strong>
                <ul>
                    <li>Type "Sunny" - for sunny weather</li>
                    <li>Type "Rainy" - for rainy weather</li>
                    <li>Type "Cloudy" - for cloudy weather</li>
                    <li>Type "Snowy" - for snowy weather</li>
                    <li>Type "Storm" - for thunderstorm</li>
                </ul>
            </div>

            <small style="color: var(--text-secondary);">
                💡 Demo data is available. Real-time API may be blocked by your network.
            </small>
        </div>
    `;
}

function displayLoading() {
    contentDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">
                Getting weather data...
            </div>
        </div>
    `;
}

function getGradientFromCondition(description) {
    const lower = description.toLowerCase();

    if (
        lower.includes('rain') ||
        lower.includes('drizzle') ||
        lower.includes('shower')
    ) {
        return 'bg-rainy';
    }

    if (
        lower.includes('snow') ||
        lower.includes('sleet')
    ) {
        return 'bg-snow';
    }

    if (
        lower.includes('thunder') ||
        lower.includes('storm')
    ) {
        return 'bg-thunderstorm';
    }

    if (
        lower.includes('cloud') ||
        lower.includes('overcast') ||
        lower.includes('fog')
    ) {
        return 'bg-cloudy';
    }

    return 'bg-sunny';
}

async function fetchWeatherByLocation(locationName) {
    try {
        const lowerName = locationName.toLowerCase();

        // Check demo locations first
        if (demoWeatherData[lowerName]) {
            return demoWeatherData[lowerName];
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `https://wttr.in/${encodeURIComponent(locationName)}?format=j1`,
            {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();

        if (!data.current_condition) {
            throw new Error('Invalid weather data');
        }

        const area = data.nearest_area[0];
        const current = data.current_condition[0];

        return {
            location: `${area.areaName[0].value}, ${area.country[0].value}`,
            temp: Number(current.temp_C),
            feelsLike: Number(current.FeelsLikeC),
            description: current.weatherDesc[0].value,
            humidity: current.humidity,
            windSpeed: Number(current.windspeedKmph),
            gradient: getGradientFromCondition(
                current.weatherDesc[0].value
            ),
            isDemo: false
        };

    } catch (error) {
        console.error(error);

        throw new Error(
            `Unable to fetch weather for "${locationName}".`
        );
    }
}

async function loadWeatherByLocation(locationName) {
    displayLoading();

    try {
        const weatherData =
            await fetchWeatherByLocation(locationName);

        displayWeather(weatherData);

    } catch (error) {
        displayError(error.message);
    }
}

function getGeolocation() {
    if (!navigator.geolocation) {
        displayError(
            'Geolocation is not supported by your browser.'
        );
        return;
    }

    displayLoading();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                const response = await fetch(
                    `https://wttr.in/${latitude},${longitude}?format=j1`
                );

                const data = await response.json();

                const area = data.nearest_area[0];
                const current = data.current_condition[0];

                displayWeather({
                    location:
                        `${area.areaName[0].value}, ${area.country[0].value}`,
                    temp: Number(current.temp_C),
                    feelsLike: Number(current.FeelsLikeC),
                    description:
                        current.weatherDesc[0].value,
                    humidity: current.humidity,
                    windSpeed:
                        Number(current.windspeedKmph),
                    gradient:
                        getGradientFromCondition(
                            current.weatherDesc[0].value
                        ),
                    isDemo: false
                });

            } catch (error) {
                displayError(
                    'Could not fetch weather for your location.'
                );
            }
        },
        () => {
            displayError(
                'Location access denied.'
            );
        }
    );
}

// Search button
searchBtn.addEventListener('click', () => {
    const location = locationInput.value.trim();

    if (location) {
        loadWeatherByLocation(location);
        locationInput.value = '';
    }
});

// Enter key search
locationInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

// Current location button
geoBtn.addEventListener('click', getGeolocation);

// Default weather on startup
window.addEventListener('load', () => {
    displayWeather(demoWeatherData.sunny);
});