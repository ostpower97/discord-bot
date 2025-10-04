import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Bot nur mit minimalen Intents
const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

async function postDailyData() {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        await new Promise(resolve => client.once('clientReady', resolve));

        // Kanal direkt abrufen (Client muss Mitglied sein)
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        if (!channel) {
            console.log('Kanal nicht gefunden!');
            client.destroy();
            return;
        }

        // API-Daten abrufen
        const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
            console.log('Keine Daten von AlphaVantage erhalten.');
            client.destroy();
            return;
        }

        // Nachricht formatieren
        const gainers = data['top_gainers']?.slice(0, 5) || [];
        const losers = data['top_losers']?.slice(0, 5) || [];

        let message = '**📈 Top 5 Gainer:**\n';
        gainers.forEach(item => {
            message += `• ${item.symbol}: ${item.change_percent}\n`;
        });

        message += '\n**📉 Top 5 Loser:**\n';
        losers.forEach(item => {
            message += `• ${item.symbol}: ${item.change_percent}\n`;
        });

        // Nachricht senden
        await channel.send(message);
        console.log('✅ Nachricht erfolgreich gepostet');

    } catch (error) {
        console.error('Fehler beim Posten:', error);
    } finally {
        client.destroy();
    }
}

postDailyData();
