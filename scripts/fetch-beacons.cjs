const fs = require('fs');

async function run() {
  try {
    const res = await fetch('https://beacons.ai/gocafe.official', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    fs.writeFileSync('scripts/beacons.html', html, 'utf8');
    console.log('Saved beacons.html, size:', html.length);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
