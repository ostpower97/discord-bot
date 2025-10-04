import dotenv from "dotenv";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Discord-Client initialisieren
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

async function fetchStockData() {
  const response = await fetch("https://api.chartmill.com/stock/analyst-up-and-down-grades");
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  const html = await response.text();

  // Datenquelle geändert → wir holen Gainer/Loser von chartmill API
  const gainersRes = await fetch("https://api.chartmill.com/stock/top-gainers");
  const losersRes = await fetch("https://api.chartmill.com/stock/top-losers");

  const gainers = (await gainersRes.json()).slice(0, 5);
  const losers = (await losersRes.json()).slice(0, 5);

  return { gainers, losers };
}

async function postDailyData() {
  try {
    const { gainers, losers } = await fetchStockData();

    // Formatierung
    const gainersMsg = gainers
      .map(
        (g) =>
          `• **${g.symbol}** (${g.company_name || "?"}) — ${g.percentage_change.toFixed(2)}%`
      )
      .join("\n");

    const losersMsg = losers
      .map(
        (l) =>
          `• **${l.symbol}** (${l.company_name || "?"}) — ${l.percentage_change.toFixed(2)}%`
      )
      .join("\n");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toLocaleDateString("de-DE");

    const message = `📊 **Top 5 Gainer & Loser – ${dateStr} (Vortag)**\n\n📈 **Top 5 Gainer:**\n${gainersMsg}\n\n📉 **Top 5 Loser:**\n${losersMsg}`;

    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send(message);

    console.log("Tagesdaten erfolgreich gepostet!");
  } catch (err) {
    console.error("Fehler beim Posten:", err);
  } finally {
    client.destroy();
  }
}

client.once("ready", postDailyData);
client.login(DISCORD_TOKEN);
