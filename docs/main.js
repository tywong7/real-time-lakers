async function fetchMatches() {
    try {
        const response = await fetch('https://www.balldontlie.io/api/v1/games?seasons[]=2023&team_ids[]=14&per_page=82&end_date=2024-01-29');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

const db = new Dexie('LakersDatabase');
db.version(1).stores({
    matches: '++id, team, date, result' // Define your schema based on the API data
});

async function storeMatches() {
    if (navigator.onLine) {
        try {
            const matches = await fetchMatches();
            if (matches && matches.data) {
                await db.matches.bulkPut(matches.data);
                console.log('Matches stored in IndexedDB');
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    } else {
        console.log('Offline mode: Using cached data.');
    }
}

async function displayMatches() {
    const matches = await db.matches.orderBy('date').reverse().toArray();
    const matchesElement = document.getElementById('matches');

    matchesElement.innerHTML = matches.map(match => 
        `<div class="match-container">
            <div class="match-date">${match.date.substring(0, 10)}</div>
            <div class="match-details">
                <span class="team visitor-team">${match.visitor_team.full_name} (${match.visitor_team_score})</span>
                <span class="vs">vs</span>
                <span class="team home-team">${match.home_team.full_name} (${match.home_team_score})</span>
            </div>
			
        </div>`
    ).join('');
}

async function init() {
    await storeMatches();
    await displayMatches();
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

window.onload = init;
