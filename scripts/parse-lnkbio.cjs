const fs = require('fs');

if (fs.existsSync('scripts/lnkbio.html')) {
  const html = fs.readFileSync('scripts/lnkbio.html', 'utf8');
  console.log('HTML size:', html.length);

  // find container classes or style tags
  const styleTags = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  console.log('Style tags count:', styleTags.length);
  fs.writeFileSync('scripts/styles.css', styleTags.join('\n\n'));

  // find classes for pb-linkbox
  const linkboxMatches = html.match(/class="[^"]*pb-linkbox[^"]*"/gi) || [];
  console.log('linkbox classes:', linkboxMatches.slice(0, 5));

  // find container / wrapper
  const containers = html.match(/<div[^>]*class="[^"]*(?:container|profile|wrapper|col)[^"]*"[^>]*>/gi) || [];
  console.log('Containers:', containers.slice(0, 10));

  // search for 619 or container width
  const links = html.match(/<link[^>]*rel="stylesheet"[^>]*>/gi) || [];
  console.log('Stylesheet links:', links);
} else {
  console.log('File scripts/lnkbio.html not found');
}
