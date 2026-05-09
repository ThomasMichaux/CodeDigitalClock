// DOM Elements — selected via data-* attributes
const clockEl = document.querySelector('[data-clock]');
const dateEl = document.querySelector('[data-date]');
const locationEl = document.querySelector('[data-location]');
const tempEl = document.querySelector('[data-temp]');
const weatherDescEl = document.querySelector('[data-weather-desc]');
const weatherIconContainer = document.querySelector('[data-weather-icon-container]');
const errorContainer = document.querySelector('[data-error-container]');
const locIconBox = document.querySelector('[data-loc-icon-box]');

let clockIntervalId = null;
let lastDateString = '';

// --- 1. CLOCK & DATE ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const textNode = clockEl.childNodes[0];
    if (textNode) textNode.textContent = `${hours}:${minutes}`;
    const secSpan = clockEl.querySelector('.seconds-indicator');
    if (secSpan) secSpan.textContent = `:${seconds}`;
}

function updateDate() {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();

    const mainDateString = `${dayNum} ${monthName}`;
    const secondaryDateString = `${dayName} <span class="date-separator">•</span> ${year}`;
    const newHTML = `<span class="date-main" data-date-main>${mainDateString}</span><span class="date-secondary" data-date-secondary>${secondaryDateString}</span>`;

    if (lastDateString !== newHTML) {
        dateEl.innerHTML = newHTML;
        lastDateString = newHTML;
        const dateMain = dateEl.querySelector('[data-date-main]');
        const dateSecondary = dateEl.querySelector('[data-date-secondary]');
        if (dateMain) dateMain.removeAttribute('aria-busy');
        if (dateSecondary) dateSecondary.removeAttribute('aria-busy');
    }
}

function startClock() {
    updateClock();
    updateDate();
    clockIntervalId = setInterval(() => {
        updateClock();
        updateDate();
    }, 1000);
}

// --- 2. WEATHER ---
const weatherCodes = {
    0: { desc: 'Clear sky', icon: 'sun' },
    1: { desc: 'Mainly clear', icon: 'cloud-sun' },
    2: { desc: 'Partly cloudy', icon: 'cloud-sun' },
    3: { desc: 'Overcast', icon: 'cloud' },
    45: { desc: 'Fog', icon: 'cloud-fog' },
    48: { desc: 'Depositing rime fog', icon: 'cloud-fog' },
    51: { desc: 'Light drizzle', icon: 'cloud-rain' },
    53: { desc: 'Moderate drizzle', icon: 'cloud-rain' },
    55: { desc: 'Dense drizzle', icon: 'cloud-rain' },
    56: { desc: 'Freezing drizzle', icon: 'cloud-rain' },
    57: { desc: 'Heavy freezing drizzle', icon: 'cloud-rain' },
    61: { desc: 'Slight rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate rain', icon: 'cloud-rain' },
    65: { desc: 'Heavy rain', icon: 'cloud-rain' },
    66: { desc: 'Light freezing rain', icon: 'cloud-rain' },
    67: { desc: 'Heavy freezing rain', icon: 'cloud-rain' },
    71: { desc: 'Slight snow', icon: 'cloud-snow' },
    73: { desc: 'Moderate snow', icon: 'cloud-snow' },
    75: { desc: 'Heavy snow', icon: 'cloud-snow' },
    77: { desc: 'Snow grains', icon: 'cloud-snow' },
    80: { desc: 'Slight rain showers', icon: 'cloud-rain' },
    81: { desc: 'Moderate rain showers', icon: 'cloud-rain' },
    82: { desc: 'Violent rain showers', icon: 'cloud-rain' },
    85: { desc: 'Slight snow showers', icon: 'cloud-snow' },
    86: { desc: 'Heavy snow showers', icon: 'cloud-snow' },
    95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
    96: { desc: 'Thunderstorm with hail', icon: 'cloud-lightning' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' }
};

function getIconSvg(type) {
    const icons = {
        sun: '<path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="5" fill="#69BE28" stroke="none"/>',
        'cloud-sun': '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="M17 18H7a5 5 0 1 1 4.9-6" stroke="#fff" stroke-width="2" fill="none"/><circle cx="13" cy="9" r="3" fill="#69BE28" stroke="none"/>',
        cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
        'cloud-rain': '<path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 16.3"/>',
        'cloud-snow': '<path d="M8 16v2"/><path d="M8 20v2"/><path d="M16 16v2"/><path d="M16 20v2"/><path d="M12 18v2"/><path d="M12 22v2"/><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"/>',
        'cloud-lightning': '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23" stroke="#69BE28" fill="none"/>',
        'cloud-fog': '<path d="M4 14h16"/><path d="M4 18h16"/><path d="M4 22h16"/><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[type] || icons.cloud}</svg>`;
}

function showError(msg) {
    errorContainer.textContent = msg;
    errorContainer.hidden = false;
    console.error(msg);
}

function hideError() {
    errorContainer.hidden = true;
    errorContainer.textContent = '';
}

async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
        const data = await response.json();
        if (!data.current_weather) throw new Error('Invalid weather data received');
        const current = data.current_weather;
        const codeInfo = weatherCodes[current.weathercode] || { desc: 'Unknown', icon: 'cloud' };
        tempEl.textContent = Math.round(current.temperature);
        weatherDescEl.textContent = codeInfo.desc;
        weatherIconContainer.innerHTML = getIconSvg(codeInfo.icon);
    } catch (err) {
        showError("Could not load weather. Check network connection.");
        tempEl.textContent = "--";
        weatherDescEl.textContent = "Error";
        console.error('Weather fetch error:', err.message);
    }
}

function initLocation() {
    if (!locIconBox) return;
    locIconBox.classList.add('icon-pulsing');
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                    headers: { 'User-Agent': 'DigitalClockApp/1.0 (https://github.com/your-username/digital-clock)' }
                })
                    .then(res => {
                        if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        locIconBox.classList.remove('icon-pulsing');
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county || "Unknown Location";
                        locationEl.textContent = city;
                        locationEl.classList.remove('skeleton');
                        locationEl.removeAttribute('aria-busy');
                        hideError();
                        fetchWeather(latitude, longitude);
                    })
                    .catch((err) => {
                        locIconBox.classList.remove('icon-pulsing');
                        locationEl.textContent = "Unknown Location";
                        locationEl.classList.remove('skeleton');
                        locationEl.removeAttribute('aria-busy');
                        console.error('Geocoding error:', err.message);
                        fetchWeather(latitude, longitude);
                    });
            },
            (error) => {
                locIconBox.classList.remove('icon-pulsing');
                let msg = "Location access denied.";
                switch (error.code) {
                    case error.PERMISSION_DENIED: msg = "Location permission denied."; break;
                    case error.POSITION_UNAVAILABLE: msg = "Location unavailable."; break;
                    case error.TIMEOUT: msg = "Location request timed out."; break;
                }
                locationEl.textContent = "Location Unavailable";
                locationEl.classList.remove('skeleton');
                locationEl.removeAttribute('aria-busy');
                showError(msg + " Showing default weather.");
                fetchWeather(51.5074, -0.1278);
            }
        );
    } else {
        locIconBox.classList.remove('icon-pulsing');
        locationEl.textContent = "Geolocation not supported";
        locationEl.classList.remove('skeleton');
        locationEl.removeAttribute('aria-busy');
        showError("Geolocation is not supported by your browser. Showing default weather.");
        fetchWeather(51.5074, -0.1278);
    }
}

function cleanup() {
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
}

// --- INIT ---
startClock();
initLocation();

window.addEventListener('beforeunload', cleanup);