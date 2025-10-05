import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

// Funktion, um NASDAQ-100 Ticker von Wikipedia zu holen
async function getNasdaq100Symbols() {
  try {
    const url = 'https://de.wikipedia.org/wiki/NASDAQ-100';
    const resp = await fetch(url);
    const html = await resp.text();

    const symbolSet = new Set();
    const rowRegex = /<tr>[\s\S]*?<td>([A-Z0-9, ]+)<\/td>[\s\S]*?<td>([^<]+)<\/td>/g;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const symbols = match[1].split(',').map(s => s.trim());
      for (const symbol of symbols) {
        if (/^\d+$/.test(symbol)) continue; // nur Zahlen ignorieren
        symbolSet.add(symbol);
      }
    }
    return symbolSet;
  } catch (err) {
    console.error('Fehler beim Abrufen der NASDAQ-100-Liste:', err);
    return new Set();
  }
}

// Hilfsfunktion zum Abrufen der Top-Gainer und -Loser
async function getTopMovers() {
  try {
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    const gainers = data.top_gainers?.slice(0, 20) || [];
    const losers = data.top_losers?.slice(0, 20) || [];

    return { gainers, losers };
  } catch (err) {
    console.error('Fehler beim Abrufen der API-Daten:', err);
    return { gainers: [], losers: [] };
  }
}

// Funktion, um alles im Discord-Kanal zu posten
async function postDailyData() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    const nasdaq100 = await getNasdaq100Symbols();
    const { gainers, losers } = await getTopMovers();

    const filteredGainers = gainers.filter(stock => nasdaq100.has(stock.ticker)).slice(0, 5);
    const filteredLosers = losers.filter(stock => nasdaq100.has(stock.ticker)).slice(0, 5);

    let message = '📈 **Top 5 Gainer (NASDAQ-100, Vortag):**\n';
    filteredGainers.forEach(stock => {
      message += `• ${stock.ticker}: ${stock.change_percentage}\n`;
    });

    message += '\n📉 **Top 5 Loser (NASDAQ-100, Vortag):**\n';
    filteredLosers.forEach(stock => {
      message += `• ${stock.ticker}: ${stock.change_percentage}\n`;
    });

    await channel.send(message);
    console.log('✅ Erfolgreich im Discord gepostet.');
  } catch (err) {
    console.error('Fehler beim Posten:', err);
  }
}

// Wenn der Client bereit ist → direkt posten
client.once('ready', () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);
  postDailyData().then(() => client.destroy());
});

client.login(TOKEN);
