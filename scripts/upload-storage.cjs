const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://iuoxkoburrtmjajfrsdb.supabase.co';
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const supabase = createClient(url, serviceRoleKey);

async function uploadFile(fileName) {
  const filePath = path.join(__dirname, '..', 'public', fileName);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const { data, error } = await supabase.storage
    .from('public_media')
    .upload(fileName, fileBuffer, {
      contentType: mime,
      upsert: true
    });

  if (error) console.log('Upload error for', fileName, error);
  else console.log('Upload OK for', fileName, data);
}

async function run() {
  const files = [
    'beacons-banner-real.jpg',
    'beacons-avatar-real.png',
    'thumb-order.webp',
    'thumb-shopee.jpg',
    'thumb-tiktok.jpg',
    'thumb-stores.jpg',
    'thumb-recruit.webp',
    'hophuonganh-avatar.jpg',
    'thumb-gocafe-circle.jpg',
    'thumb-shopee-circle.png',
    'thumb-tiktok-circle.jpg'
  ];

  for (const f of files) {
    await uploadFile(f);
  }
}
run();
