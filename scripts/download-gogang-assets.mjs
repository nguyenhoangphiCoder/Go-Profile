import fs from "node:fs";
import path from "node:path";

const images = [
  {
    name: "gogang-bg-source.png",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/profile_gocafe.com.png?q=1696253081.6030595"
  },
  {
    name: "gogang-header-team.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/050b9130-9647-4b35-9ebc-435f5d2a318f__link-in-bio__header-block__home__2c2684fb-205a-4438-ae3d-fe1e4e02af9b__334bd332-c51c-46d0-9559-d6c6e62a0a81.jpg?t=1696253293766"
  },
  {
    name: "gogang-link-zalo.png",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/link_images/c122b94c-014e-4ccc-a2d4-06b4f0bb8837.png"
  },
  {
    name: "gogang-link-order.webp",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/1a812064-b9dd-4b5a-b6f8-9f1d4f3be6f4__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__e325520d-31ac-4791-ab8e-499737d4ad0b__5d0486c8-94b9-483a-8ecf-27450fba5ae9.webp?t=1793503501959"
  },
  {
    name: "gogang-link-stores.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/f01d7fa0-764c-40f9-bd0d-d1265749de46__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__5e2ed41a-247e-4353-9636-7c3d12ef0d12__c0707905-da8a-4d47-9113-ab5ec8b4981d.jpg?t=1696260650028"
  },
  {
    name: "gogang-link-fb-tuyendung.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/9928c118-a1db-42f3-a221-55e6028f1de2__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__e244d14d-4384-411f-8c4d-0edaf3a01de7__6866e3dc-9a5c-48c7-b7b8-c99e20edc46b.jpg?t=1696254265158"
  },
  {
    name: "gogang-link-fb-gocafe.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/3360e6a1-041e-4360-8eee-e8dc5737e30b__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__1e9e45a4-63fa-49e2-93f3-21a0627394eb__c60eaa70-c9d1-4612-aac0-c4a12ac2a1f6.jpg?t=1696254085616"
  },
  {
    name: "gogang-link-tiktok-gogang.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/32c5378b-83cf-49fa-9753-549eb1a7e6dc__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__e8579a2b-dddd-4a62-9c7e-6f8874ce1c39__e84ce974-4d45-4432-80bc-4ee87670814d.jpg?t=1696254233433"
  },
  {
    name: "gogang-link-tiktok-gocafe.jpg",
    url: "https://cdn.beacons.ai/user_content/CXR5HixYRZSjQEwvjRLHfORhHl32/referenced_images/a8e3cddc-e9e9-4eed-b872-d0da176e104c__link-in-bio__links-block__home__dedbb698-ff0d-4064-aab7-67720e9a1389__ee991a5f-2572-4325-985a-19790dd0544d__09f39d4b-e442-493c-9206-7b83002cb30d.jpg?t=1696254250969"
  }
];

async function download() {
  for (const item of images) {
    try {
      console.log(`Downloading ${item.name} from ${item.url}...`);
      const res = await fetch(item.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      if (!res.ok) {
        console.error(`Failed ${item.name}: ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join("public", item.name), buffer);
      console.log(`Saved public/${item.name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error ${item.name}:`, err.message);
    }
  }
}

download();
