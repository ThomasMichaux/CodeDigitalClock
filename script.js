const timeEl = document.querySelector('[data-time]');
const secondsEl = document.querySelector('.seconds-indicator');
const dateEl = document.querySelector('[data-date]');
const locationEl = document.querySelector('[data-location]');
const weatherValueEl = document.querySelector('[data-weather-value]');
const tempEl = document.querySelector('[data-temp]');
const weatherDescEl = document.querySelector('[data-weather-desc]');
const weatherIconEl = document.querySelector('[data-weather-icon-container]');
const errorEl = document.querySelector('[data-error-container]');
const locIconEl = document.querySelector('[data-loc-icon-box]');

const FETCH_TIMEOUT_MS = 8000;
const GEOLOCATION_TIMEOUT_MS = 10000;
const GEOLOCATION_MAX_AGE_MS = 10 * 60 * 1000;
const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const WEATHER_RETRY_MS = 60 * 1000;
const WEATHER_CHECK_MS = 60 * 1000;
const COORD_DECIMALS = 2;
const DATE_LOCALE = 'en-GB';
const FALLBACK_COORDS = { latitude: 51.51, longitude: -0.13 };

function setText(el, value) {
    if (el) el.textContent = value;
}

let lastMinuteKey = '';
let lastDateKey = '';

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const minuteKey = `${hours}:${minutes}`;

    if (minuteKey !== lastMinuteKey) {
        lastMinuteKey = minuteKey;
        setText(timeEl, minuteKey);
    }
    if (timeEl) timeEl.dateTime = `${minuteKey}:${seconds}`;
    setText(secondsEl, `:${seconds}`);
}

function toIsoDate(date) {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateDate() {
    if (!dateEl) return;
    const now = new Date();
    const dateKey = now.toDateString();
    if (dateKey === lastDateKey) return;
    lastDateKey = dateKey;

    const main = document.createElement('time');
    main.className = 'date-main';
    main.dateTime = toIsoDate(now);
    main.textContent = `${now.getDate()} ${now.toLocaleDateString(DATE_LOCALE, { month: 'long' })}`;

    const separator = document.createElement('span');
    separator.className = 'date-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = '•';

    const secondary = document.createElement('span');
    secondary.className = 'date-secondary';
    secondary.append(
        now.toLocaleDateString(DATE_LOCALE, { weekday: 'long' }),
        ' ', separator, ' ',
        String(now.getFullYear())
    );

    dateEl.replaceChildren(main, secondary);
    dateEl.removeAttribute('aria-busy');
}

function tick() {
    updateClock();
    updateDate();
    setTimeout(tick, 1000 - (Date.now() % 1000));
}

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

const weatherIcons = {
    sun: '<path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="5" class="icon-accent" fill="currentColor" stroke="none"/>',
    'cloud-sun': '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="M17 18H7a5 5 0 1 1 4.9-6"/><circle cx="13" cy="9" r="3" class="icon-accent" fill="currentColor" stroke="none"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    'cloud-rain': '<path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 16.3"/>',
    'cloud-snow': '<path d="M8 16v2"/><path d="M8 20v2"/><path d="M16 16v2"/><path d="M16 20v2"/><path d="M12 18v2"/><path d="M12 22v2"/><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"/>',
    'cloud-lightning': '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23" class="icon-accent" stroke="currentColor" fill="none"/>',
    'cloud-fog': '<path d="M4 14h16"/><path d="M4 18h16"/><path d="M4 22h16"/><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"/>'
};

function getIconSvg(type) {
    const paths = weatherIcons[type] ?? weatherIcons.cloud;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const errorMessages = { location: '', weather: '' };

function setError(source, message = '') {
    errorMessages[source] = message;
    if (!errorEl) return;
    const text = [errorMessages.location, errorMessages.weather].filter(Boolean).join(' ');
    errorEl.textContent = text;
    errorEl.hidden = text === '';
}

function clearLoading(el) {
    if (!el) return;
    el.classList.remove('skeleton');
    el.removeAttribute('aria-busy');
}

let lastCoords = null;
let nextWeatherFetchAt = 0;
let weatherPending = false;
let hasWeather = false;

async function fetchWeather(coords) {
    if (weatherPending) return;
    weatherPending = true;
    lastCoords = coords;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
        const { current } = await response.json();
        if (!current) throw new Error('Invalid weather data received');
        if (!Number.isFinite(current.temperature_2m)) throw new Error('Missing temperature in weather data');

        const codeInfo = weatherCodes[current.weather_code] ?? { desc: 'Unknown', icon: 'cloud' };
        setText(tempEl, String(Math.round(current.temperature_2m)));
        setText(weatherDescEl, codeInfo.desc);
        if (weatherIconEl) weatherIconEl.innerHTML = getIconSvg(codeInfo.icon);

        hasWeather = true;
        setError('weather');
        nextWeatherFetchAt = Date.now() + WEATHER_REFRESH_MS;
    } catch (err) {
        console.error('Weather fetch error:', err);
        if (!hasWeather) {
            setText(tempEl, '--');
            setText(weatherDescEl, 'Unavailable');
            setError('weather', 'Could not load weather. Check your network connection.');
        }
        nextWeatherFetchAt = Date.now() + WEATHER_RETRY_MS;
    } finally {
        weatherPending = false;
        clearLoading(weatherValueEl);
    }
}

function refreshWeatherIfStale() {
    if (document.hidden || !lastCoords) return;
    if (Date.now() < nextWeatherFetchAt) return;
    fetchWeather(lastCoords);
}

async function resolveCityName({ latitude, longitude }) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=10&accept-language=en&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);
    const data = await response.json();
    const address = data.address ?? {};
    return address.city
        || address.town
        || address.village
        || address.municipality
        || address.county
        || address.state
        || null;
}

async function showCityName(coords) {
    try {
        const city = await resolveCityName(coords);
        setText(locationEl, city ?? 'Unknown Location');
    } catch (err) {
        console.error('Geocoding error:', err);
        setText(locationEl, 'Unknown Location');
    } finally {
        locIconEl?.classList.remove('icon-pulsing');
        clearLoading(locationEl);
    }
}

function handleLocationFailure(label, message) {
    locIconEl?.classList.remove('icon-pulsing');
    setText(locationEl, label);
    clearLoading(locationEl);
    setError('location', message);
    fetchWeather(FALLBACK_COORDS);
}

function roundCoords({ latitude, longitude }) {
    return {
        latitude: Number(latitude.toFixed(COORD_DECIMALS)),
        longitude: Number(longitude.toFixed(COORD_DECIMALS))
    };
}

function initLocation() {
    locIconEl?.classList.add('icon-pulsing');

    if (!('geolocation' in navigator)) {
        handleLocationFailure(
            'Geolocation not supported',
            'Geolocation is not supported by your browser. Showing default weather.'
        );
        return;
    }

    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            const position = roundCoords(coords);
            setError('location');
            fetchWeather(position);
            showCityName(position);
        },
        (error) => {
            const messages = {
                [error.PERMISSION_DENIED]: 'Location permission denied.',
                [error.POSITION_UNAVAILABLE]: 'Location unavailable.',
                [error.TIMEOUT]: 'Location request timed out.'
            };
            const reason = messages[error.code] ?? 'Location access denied.';
            handleLocationFailure('Location Unavailable', `${reason} Showing default weather.`);
        },
        {
            timeout: GEOLOCATION_TIMEOUT_MS,
            maximumAge: GEOLOCATION_MAX_AGE_MS,
            enableHighAccuracy: false
        }
    );
}

function handleVisibilityChange() {
    if (document.hidden) return;
    updateClock();
    updateDate();
    refreshWeatherIfStale();
}

function init() {
    tick();
    initLocation();
    setInterval(refreshWeatherIfStale, WEATHER_CHECK_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

init();