import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', async () => {
    console.log(`✅ Bot online als ${client.user.tag}`);

    try {
        const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${process.env.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
        if (!channel) return console.log('Kanal nicht gefunden!');

        await channel.send(`Tägliche API-Daten:\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``);
    } catch (error) {
        console.error(error);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);
