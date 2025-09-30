import { Logger } from './logger.js';

export class MessageHandler {
    constructor(openaiService) {
        this.openaiService = openaiService;
        this.logger = new Logger();
        this.prefix = process.env.BOT_PREFIX || '!';
        
        // Lista de palabras especiales que el bot entiende (como !help, !ping, etc.)
        this.commands = {
            help: this.handleHelpCommand.bind(this),
            clear: this.handleClearCommand.bind(this),
            stats: this.handleStatsCommand.bind(this),
            ping: this.handlePingCommand.bind(this),
        };
    }

    async handleMessage(message, sock) {
        try {
            // Sacar el texto que escribió la persona del mensaje de WhatsApp
            const messageText = this.extractMessageText(message);
            if (!messageText) return;

            const userId = message.key.remoteJid;
            const isGroup = userId.endsWith('@g.us');
            const userName = message.pushName || 'Usuario';

            this.logger.info(`Mensaje de ${userName} (${userId}): ${messageText}`);

            // Revisar si la persona escribió una palabra especial (comando) como !help
            if (messageText.startsWith(this.prefix)) {
                await this.handleCommand(messageText, userId, sock, userName);
                return;
            }

            // Enviar el mensaje a la inteligencia artificial para que responda
            await this.processWithOpenAI(messageText, userId, sock, userName, isGroup);

        } catch (error) {
            this.logger.error('Error en handleMessage:', error);
            throw error;
        }
    }

    extractMessageText(message) {
        // Sacar el texto de diferentes tipos de mensajes de WhatsApp
        if (message.message?.conversation) {
            return message.message.conversation;
        }
        
        if (message.message?.extendedTextMessage?.text) {
            return message.message.extendedTextMessage.text;
        }

        if (message.message?.imageMessage?.caption) {
            return message.message.imageMessage.caption;
        }

        if (message.message?.videoMessage?.caption) {
            return message.message.videoMessage.caption;
        }

        return null;
    }

    async handleCommand(messageText, userId, sock, userName) {
        const command = messageText.slice(this.prefix.length).split(' ')[0].toLowerCase();
        const args = messageText.slice(this.prefix.length).split(' ').slice(1);

        if (this.commands[command]) {
            await this.commands[command](userId, sock, args, userName);
        } else {
            await sock.sendMessage(userId, {
                text: `Comando desconocido: ${command}\nUsa ${this.prefix}help para ver los comandos disponibles.`
            });
        }
    }

    async processWithOpenAI(messageText, userId, sock, userName, isGroup) {
        try {
            // Mostrar que el bot está escribiendo (como cuando tu amigo está escribiendo)
            await sock.sendPresenceUpdate('composing', userId);

            // Pedirle a la inteligencia artificial que cree una respuesta
            const response = await this.openaiService.generateResponse(messageText, userId);

            // Enviar la respuesta a la persona
            await sock.sendMessage(userId, { text: response });

            this.logger.info(`Respuesta enviada a ${userName}`);

        } catch (error) {
            this.logger.error('Error procesando con OpenAI:', error);
            
            let errorMessage = process.env.ERROR_MESSAGE || 'Lo siento, hubo un error procesando tu mensaje.';
            
            if (error.message.includes('API Key')) {
                errorMessage = 'Error de configuracion. Contacta al administrador.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Muchas solicitudes, intenta de nuevo en un momento.';
            } else if (error.message.includes('cuota')) {
                errorMessage = 'Servicio temporalmente no disponible.';
            }

            await sock.sendMessage(userId, { text: errorMessage });
        } finally {
            // Dejar de mostrar que está escribiendo
            await sock.sendPresenceUpdate('paused', userId);
        }
    }

    // Funciones especiales del bot (lo que pasa cuando alguien escribe !help, !ping, etc.)
    async handleHelpCommand(userId, sock, args, userName) {
        const helpText = `
*${process.env.BOT_NAME || 'WhatsApp Bot'}* - Comandos disponibles:

${this.prefix}help - Muestra esta ayuda
${this.prefix}clear - Limpia tu historial de conversacion
${this.prefix}stats - Muestra estadisticas del bot
${this.prefix}ping - Verifica si el bot esta funcionando

*Tip:* Tambien puedes hablar conmigo directamente sin usar comandos. Estoy aqui para ayudarte!
        `;

        await sock.sendMessage(userId, { text: helpText.trim() });
    }

    async handleClearCommand(userId, sock, args, userName) {
        this.openaiService.clearConversation(userId);
        await sock.sendMessage(userId, {
            text: 'Tu historial de conversacion ha sido limpiado. Empecemos de nuevo!'
        });
    }

    async handleStatsCommand(userId, sock, args, userName) {
        const stats = this.openaiService.getStats();
        const statsText = `
*Estadisticas del Bot:*

Conversaciones activas: ${stats.activeConversations}
Total de mensajes: ${stats.totalMessages}
Estado: En linea
        `;

        await sock.sendMessage(userId, { text: statsText.trim() });
    }

    async handlePingCommand(userId, sock, args, userName) {
        const startTime = Date.now();
        const message = await sock.sendMessage(userId, { text: 'Pong!' });
        const endTime = Date.now();
        const latency = endTime - startTime;

        await sock.sendMessage(userId, {
            text: `Pong!\nLatencia: ${latency}ms`
        });
    }
}