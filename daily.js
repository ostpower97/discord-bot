import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    console.log(`✅ Bot online als ${client.user.tag}`);

    try {
        // AlphaVantage API abfragen
        const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
            console.log('Keine Daten von AlphaVantage erhalten.');
            return;
        }

        // Server + Kanal abrufen
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

        if (!channel) {
            console.log('Kanal nicht gefunden!');
            return;
        }

        // Nachricht zusammenstellen
        const gainers = data['top_gainers']?.slice(0, 5) || [];
        const losers = data['top_losers']?.slice(0, 5) || [];

        let message = '**📈 Top Gainer:**\n';
        gainers.forEach(item => {
            message += `${item.symbol}: ${item.change_percent}\n`;
        });

        message += '\n**📉 Top Loser:**\n';
        losers.forEach(item => {
            message += `${item.symbol}: ${item.change_percent}\n`;
        });

        // Nachricht senden
        await channel.send(message);

    } catch (error) {
        console.error('Fehler beim Posten:', error);
    } finally {
        // Bot schließen
        client.destroy();
    }
});

// Bot starten
client.login(process.env.DISCORD_TOKEN);
