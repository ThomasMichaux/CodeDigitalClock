// DOM Elements
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const locationEl = document.getElementById('location-text');
const tempEl = document.getElementById('temp-text');
const weatherDescEl = document.getElementById('weather-desc');
const weatherIconContainer = document.getElementById('weather-icon-container');
const errorContainer = document.getElementById('error-container');
const locIconBox = document.getElementById('loc-icon-box');

let weatherDataCache = null;

// --- 1. CLOCK & DATE FUNCTIONALITY ---

function updateClock() {
    const now = new Date();
    
    // Format Time: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    clockEl.innerHTML = `${hours}:${minutes}<span class="seconds-indicator">:${seconds}</span>`;

    // Format Date: Optimized UX
    // Structure: 
    // Line 1: 15 November (Main Focus)
    // Line 2: Monday • 2024 (Context)
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();

    const mainDateString = `${dayNum} ${monthName}`;
    const secondaryDateString = `${dayName} <span class="date-separator">•</span> ${year}`;
    
    const currentHTML = dateEl.innerHTML;
    
    const newHTML = `
        <span class="date-main">${mainDateString}</span>
        <span class="date-secondary">${secondaryDateString}</span>
    `;

    if (currentHTML !== newHTML) {
        dateEl.innerHTML = newHTML;
    }

    requestAnimationFrame(updateClock);
}

// --- 2. LOCATION & WEATHER FUNCTIONALITY ---

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
    61: { desc: 'Slight rain', icon: 'cloud-rain' },
    63: { desc: 'Moderate rain', icon: 'cloud-rain' },
    65: { desc: 'Heavy rain', icon: 'cloud-rain' },
    71: { desc: 'Slight snow', icon: 'cloud-snow' },
    73: { desc: 'Moderate snow', icon: 'cloud-snow' },
    75: { desc: 'Heavy snow', icon: 'cloud-snow' },
    95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
    96: { desc: 'Thunderstorm with hail', icon: 'cloud-lightning' },
    99: { desc: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
};

function getIconSvg(type) {
    const icons = {
        sun: '<path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path><circle cx="12" cy="12" r="5" fill="#69BE28" stroke="none"></circle>',
        'cloud-sun': '<path d="M12 2v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="M2 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="M17 18H7a5 5 0 1 1 4.9-6" stroke="#fff" stroke-width="2" fill="none"/><circle cx="13" cy="9" r="3" fill="#69BE28" stroke="none"/>',
        cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>',
        'cloud-rain': '<path d="M16 13v8"></path><path d="M8 13v8"></path><path d="M12 15v8"></path><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 16.3"></path>',
        'cloud-snow': '<path d="M8 16v2"></path><path d="M8 20v2"></path><path d="M16 16v2"></path><path d="M16 20v2"></path><path d="M12 18v2"></path><path d="M12 22v2"></path><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"></path>',
        'cloud-lightning': '<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23" stroke="#69BE28" fill="none"></polyline>',
        'cloud-fog': '<path d="M4 14h16"></path><path d="M4 18h16"></path><path d="M4 22h16"></path><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 3 16.67"></path>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[type] || icons.cloud}</svg>`;
}

function showError(msg) {
    errorContainer.textContent = msg;
    errorContainer.style.display = 'block';
    console.error(msg);
}

async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        
        if (!response.ok) throw new Error("Weather data unavailable");
        
        const data = await response.json();
        const current = data.current_weather;
        const codeInfo = weatherCodes[current.weathercode] || { desc: 'Unknown', icon: 'cloud' };

        tempEl.textContent = Math.round(current.temperature);
        weatherDescEl.textContent = codeInfo.desc;
        weatherIconContainer.innerHTML = getIconSvg(codeInfo.icon);
        
        tempEl.classList.remove('skeleton');
        weatherDescEl.classList.remove('skeleton');

    } catch (err) {
        showError("Could not load weather. Check network connection.");
        tempEl.textContent = "--";
        weatherDescEl.textContent = "Error";
        tempEl.classList.remove('skeleton');
    }
}

function initLocation() {
    locIconBox.classList.add('icon-pulsing');

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        locIconBox.classList.remove('icon-pulsing');
                        const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || "Unknown Location";
                        locationEl.textContent = city;
                        locationEl.classList.remove('skeleton');
                        fetchWeather(latitude, longitude);
                    })
                    .catch(() => {
                        locIconBox.classList.remove('icon-pulsing');
                        locationEl.textContent = "Unknown Location";
                        locationEl.classList.remove('skeleton');
                        fetchWeather(latitude, longitude); 
                    });
            },
            (error) => {
                locIconBox.classList.remove('icon-pulsing');
                let msg = "Location access denied.";
                switch(error.code) {
                    case error.PERMISSION_DENIED: msg = "Location permission denied."; break;
                    case error.POSITION_UNAVAILABLE: msg = "Location unavailable."; break;
                    case error.TIMEOUT: msg = "Location request timed out."; break;
                }
                locationEl.textContent = "Location Unavailable";
                locationEl.classList.remove('skeleton');
                showError(msg + " Showing default weather.");
                
                fetchWeather(51.5074, -0.1278); 
            }
        );
    } else {
        locIconBox.classList.remove('icon-pulsing');
        locationEl.textContent = "Geolocation not supported";
        locationEl.classList.remove('skeleton');
        fetchWeather(51.5074, -0.1278); 
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    initLocation();
});