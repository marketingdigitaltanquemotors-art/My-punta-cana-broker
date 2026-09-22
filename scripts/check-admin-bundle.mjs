const pageUrl = 'https://broker.havelgo.com/admin';
const html = await (await fetch(pageUrl, { headers: { 'cache-control': 'no-cache' } })).text();
const scripts = [...html.matchAll(/(?:src|href)="([^"]+\.js[^"]*)/g)]
  .map((match) => new URL(match[1], pageUrl).href);

let matchingBundle = '';
for (const url of scripts) {
  const source = await (await fetch(url, { headers: { 'cache-control': 'no-cache' } })).text();
  if (source.includes('mpcb_admin_token')) matchingBundle = url;
}

console.log(JSON.stringify({ scripts: scripts.length, containsNewAuth: Boolean(matchingBundle), matchingBundle }));
