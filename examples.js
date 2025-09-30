/**
 * Ideas y ejemplos para hacer tu bot más genial
 * 
 * Aquí encontrarás ejemplos fáciles de cómo añadir nuevas funciones
 * al bot, como comandos para el clima, chistes, etc.
 */

// ========================================
// EJEMPLO 1: Añadir nuevos comandos al bot (como !clima, !chiste)
// ========================================

// En src/utils/messageHandler.js, en el constructor:
/*
this.commands = {
    help: this.handleHelpCommand.bind(this),
    clear: this.handleClearCommand.bind(this),
    stats: this.handleStatsCommand.bind(this),
    ping: this.handlePingCommand.bind(this),
    
    // Comandos nuevos que puedes añadir
    tiempo: this.handleWeatherCommand.bind(this),
    joke: this.handleJokeCommand.bind(this),
    translate: this.handleTranslateCommand.bind(this),
};

// Luego crear las funciones que harán el trabajo:
async handleWeatherCommand(userId, sock, args, userName) {
    const city = args.join(' ') || 'Ciudad de Mexico';
    await sock.sendMessage(userId, {
        text: `El clima en ${city} esta... preguntale a un servicio meteorologico real!`
    });
}

async handleJokeCommand(userId, sock, args, userName) {
    const jokes = [
        "Por que los programadores prefieren usar temas oscuros? Porque la luz atrae a los bugs!",
        "Como se llama el campeon de buceo en Java? El nullPointerException",
        "Un programador va al supermercado. Su esposa le dice: 'Compra un litro de leche, y si hay huevos, trae una docena'. El programador vuelve con 12 litros de leche."
    ];
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    await sock.sendMessage(userId, { text: randomJoke });
}
*/

// ========================================
// EJEMPLO 2: Cambiar la personalidad del bot
// ========================================

// En src/services/openai.js, cambiar la personalidad del bot:
/*
const systemPrompt = `Eres un asistente util y divertido en WhatsApp. 
Tu nombre es ${process.env.BOT_NAME || 'WhatsApp Bot'}.
Características especiales:
- Siempre respondes con emojis relevantes
- Tienes un sentido del humor sutil
- Eres experto en tecnología y programación
- Puedes ayudar con tareas del día a día
- Mantienes conversaciones naturales y amigables
Responde de manera concisa pero útil.`;
*/

// ========================================
// EJEMPLO 3: Ignorar ciertos mensajes o personas
// ========================================

// En src/utils/messageHandler.js, en handleMessage():
/*
// No responder a mensajes muy cortos (como "ok")
if (messageText.length < 2) return;

// No responder a mensajes que solo tienen emojis
if (!/[a-zA-Z0-9]/.test(messageText)) return;

// No responder en ciertos grupos de WhatsApp
const restrictedGroups = ['120363XXXXXXXX@g.us'];
if (restrictedGroups.includes(userId)) return;

// Solo responder a ciertos números de teléfono
const allowedNumbers = process.env.ALLOWED_NUMBERS?.split(',') || [];
if (allowedNumbers.length > 0 && !allowedNumbers.includes(userId)) return;
*/

// ========================================
// EJEMPLO 4: Conectar con servicios de internet (noticias, clima, etc.)
// ========================================

/*
// Añadir estos nuevos comandos:
this.commands = {
    // ... otros comandos
    noticias: this.handleNewsCommand.bind(this),
    cotizacion: this.handleStockCommand.bind(this),
};

async handleNewsCommand(userId, sock, args, userName) {
    try {
        // Pedir noticias a un servicio de internet (necesitas registrarte gratis en newsapi.org)
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=mx&apiKey=${process.env.NEWS_API_KEY}`);
        const data = await response.json();
        
        const headlines = data.articles.slice(0, 3).map((article, index) => 
            `${index + 1}. ${article.title}\n   ${article.url}`
        ).join('\n\n');
        
        await sock.sendMessage(userId, {
            text: `*Noticias Principales:*\n\n${headlines}`
        });
    } catch (error) {
        await sock.sendMessage(userId, {
            text: 'Error obteniendo noticias. Intenta mas tarde.'
        });
    }
}

async handleStockCommand(userId, sock, args, userName) {
    const symbol = args[0]?.toUpperCase() || 'AAPL';
    // Conectar con un servicio de precios de acciones
    await sock.sendMessage(userId, {
        text: `La cotizacion de ${symbol} esta... configura una API real!`
    });
}
*/

// ========================================
// EJEMPLO 5: Hacer que el bot recuerde cosas (como notas de los usuarios)
// ========================================

/*
// Crear un archivo para guardar información permanentemente:
{
    "users": {},
    "groups": {},
    "settings": {}
}

// En src/utils/messageHandler.js, añadir:
import fs from 'fs';

class MessageHandler {
    constructor(openaiService) {
        // ... código existente
        this.dbPath = './db.json';
        this.db = this.loadDB();
    }
    
    loadDB() {
        try {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        } catch {
            return { users: {}, groups: {}, settings: {} };
        }
    }
    
    saveDB() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
    }
    
    // Función para que las personas puedan guardar notas con !note
    async handleNoteCommand(userId, sock, args, userName) {
        const note = args.join(' ');
        if (!note) {
            await sock.sendMessage(userId, { text: 'Uso: !note <tu nota>' });
            return;
        }
        
        if (!this.db.users[userId]) this.db.users[userId] = { notes: [] };
        this.db.users[userId].notes.push({
            text: note,
            date: new Date().toISOString()
        });
        this.saveDB();
        
        await sock.sendMessage(userId, { text: 'Nota guardada!' });
    }
}
*/

// ========================================
// EJEMPLO 6: Evitar que la gente envíe muchos mensajes muy rápido
// ========================================

/*
class MessageHandler {
    constructor(openaiService) {
        // ... código existente
        this.userLastMessage = new Map();
        this.rateLimitDelay = 5000; // Esperar 5 segundos entre cada mensaje
    }
    
    async handleMessage(message, sock) {
        const userId = message.key.remoteJid;
        const now = Date.now();
        const lastMessage = this.userLastMessage.get(userId) || 0;
        
        if (now - lastMessage < this.rateLimitDelay) {
            await sock.sendMessage(userId, {
                text: 'Espera un momento antes de enviar otro mensaje.'
            });
            return;
        }
        
        this.userLastMessage.set(userId, now);
        
        // ... el resto del código que maneja los mensajes
    }
}
*/

export {
    // Aquí puedes exportar funciones si las necesitas en otros archivos
};