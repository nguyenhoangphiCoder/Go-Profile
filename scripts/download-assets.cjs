const fs = require('fs');

async function download() {
  const items = [
    { url: 'https://cdn2.lnk.bi/profilepics/-1773101_20231209555.jpg', dest: 'public/hophuonganh-avatar.jpg' },
    { url: 'https://cdn2.lnk.bi/uploads/13921266_20260716141833136-1024.jpg', dest: 'public/thumb-gocafe-circle.jpg' },
    { url: 'https://cdn2.lnk.bi/uploads/6404353_20231209112740419-1024.png', dest: 'public/thumb-shopee-circle.png' },
    { url: 'https://cdn2.lnk.bi/uploads/6411555_20231209112810804-1024.jpg', dest: 'public/thumb-tiktok-circle.jpg' }
  ];

  for (const item of items) {
    try {
      console.log(`Downloading ${item.url}...`);
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(item.dest, buf);
        console.log(`Saved ${item.dest} (${buf.length} bytes)`);
      } else {
        console.error(`Failed ${item.url}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Error ${item.url}:`, e.message);
    }
  }
}

download();
