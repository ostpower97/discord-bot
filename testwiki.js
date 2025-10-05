import fetch from 'node-fetch';

async function testWikiScrape() {
  const url = 'https://de.wikipedia.org/wiki/NASDAQ-100';
  const resp = await fetch(url);
  const html = await resp.text();

  const symbolNameMap = new Map();

  // Suche nach Tabellenzeilen mit <tr>…<td>SYMBOL</td>…<td>Name</td>
  const rowRegex = /<tr>[\s\S]*?<td>([A-Z0-9]+)<\/td>[\s\S]*?<td>([^<]+)<\/td>/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const symbol = match[1].trim();
    const name = match[2].trim();
    symbolNameMap.set(symbol, name);
  }

  console.log(`Gefundene NASDAQ-100-Symbole: ${symbolNameMap.size}`);
  for (const [symbol, name] of symbolNameMap.entries()) {
    console.log(symbol, '-', name);
  }
}

testWikiScrape();
