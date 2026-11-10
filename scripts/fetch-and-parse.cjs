const fs = require('fs');

async function main() {
  const res = await fetch('https://lnk.bio/hophuonganh.gocafe', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  console.log('HTML status:', res.status, 'length:', html.length);
  fs.writeFileSync('scripts/lnkbio.html', html);

  // find container classes
  const regexContainer = /class="([^"]*(?:container|profile|main|card|linkbox)[^"]*)"/gi;
  let match;
  const classes = new Set();
  while ((match = regexContainer.exec(html)) !== null) {
    classes.add(match[1]);
  }
  console.log('Relevant classes:', Array.from(classes).slice(0, 15));

  // Search for pb-linkbox
  const pbMatches = html.match(/<a[^>]*pb-linkbox[^>]*>[\s\S]*?<\/a>/gi) || [];
  console.log('Found pb-linkbox:', pbMatches.length);
  if (pbMatches.length > 0) {
    console.log('First pb-linkbox HTML:\n', pbMatches[0]);
  }

  // Find style elements
  const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  fs.writeFileSync('scripts/lnkbio-styles.css', styles.join('\n\n'));
  console.log('Saved styles.css, count:', styles.length);
}

main().catch(console.error);
