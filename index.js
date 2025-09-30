import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import dotenv from 'dotenv';
import { OpenAIService } from './src/services/openai.js';
import { MessageHandler } from './src/utils/messageHandler.js';
import { Logger } from './src/utils/logger.js';

// Aquí cargamos la configuración secreta (como la clave de OpenAI)
dotenv.config();

class WhatsAppBot {
    constructor() {
        this.openaiService = new OpenAIService();
        this.messageHandler = new MessageHandler(this.openaiService);
        this.logger = new Logger();
        this.sock = null;
        // Marcar cuando se encendió el bot - solo responder mensajes después de esta hora
        this.startTime = Date.now();
    }

    async initialize() {
        try {
            // Preparar los datos para conectarse a WhatsApp (como recordar tu sesión)
            const { state, saveCreds } = await useMultiFileAuthState('./auth');
            
            // Verificar que tengamos la última versión del programa de WhatsApp
            const { version, isLatest } = await fetchLatestBaileysVersion();
            
            this.logger.info(`Usando Baileys v${version.join('.')}, es la última: ${isLatest}`);

            // Crear la conexión principal con WhatsApp
            this.sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: true,
                auth: state,
                generateHighQualityLinkPreview: true,
            });

            // Guardar automáticamente los datos de sesión para no perder la conexión
            this.sock.ev.on('creds.update', saveCreds);

            // Escuchar cuando se conecta o desconecta de WhatsApp
            this.sock.ev.on('connection.update', (update) => this.handleConnection(update));

            // Escuchar todos los mensajes que lleguen al bot
            this.sock.ev.on('messages.upsert', (messageUpdate) => this.handleMessages(messageUpdate));

            this.logger.info('Bot inicializado correctamente');
            
            // Mostrar configuración de mensajes antiguos
            const ignoreOld = process.env.IGNORE_OLD_MESSAGES === 'true';
            const maxAge = process.env.MAX_MESSAGE_AGE_MINUTES || '5';
            if (ignoreOld) {
                this.logger.info(`Configurado para ignorar mensajes de más de ${maxAge} minutos`);
            } else {
                this.logger.info('Respondiendo a todos los mensajes (incluso antiguos)');
            }
        } catch (error) {
            this.logger.error('Error inicializando el bot:', error);
        }
    }

    handleConnection(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.logger.info('Codigo QR generado, escanealo con tu WhatsApp');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            this.logger.info('Conexión cerrada debido a:', lastDisconnect?.error);
            
            if (shouldReconnect) {
                this.logger.info('Reconectando...');
                this.initialize();
            }
        } else if (connection === 'open') {
            this.logger.info('Bot conectado exitosamente!');
        }
    }

    async handleMessages(messageUpdate) {
        const { messages } = messageUpdate;

        for (const message of messages) {
            // No responder a nuestros propios mensajes (evitar conversaciones infinitas)
            if (message.key.fromMe) continue;
            
            // No responder a los estados de WhatsApp (esas historias que suben las personas)
            if (message.key.remoteJid === 'status@broadcast') continue;

            // Solo responder mensajes que llegaron DESPUÉS de encender el bot
            const ignoreOldMessages = process.env.IGNORE_OLD_MESSAGES === 'true';
            if (ignoreOldMessages && message.messageTimestamp) {
                const messageTime = message.messageTimestamp * 1000; // WhatsApp da el tiempo en segundos
                const maxAge = parseInt(process.env.MAX_MESSAGE_AGE_MINUTES || '5') * 60 * 1000;
                const cutoffTime = Math.max(this.startTime, Date.now() - maxAge);
                
                if (messageTime < cutoffTime) {
                    const userName = message.pushName || 'Usuario';
                    const messageAge = Math.round((Date.now() - messageTime) / 1000 / 60);
                    this.logger.info(`Ignorando mensaje de ${userName} (${messageAge} minutos de antigüedad)`);
                    continue;
                }
            }

            try {
                await this.messageHandler.handleMessage(message, this.sock);
            } catch (error) {
                this.logger.error('Error manejando mensaje:', error);
                
                // Si algo sale mal, enviar un mensaje de disculpa al usuario
                await this.sock.sendMessage(message.key.remoteJid, {
                    text: process.env.ERROR_MESSAGE || 'Lo siento, hubo un error procesando tu mensaje.'
                });
            }
        }
    }

    async stop() {
        if (this.sock) {
            await this.sock.logout();
            this.logger.info('Bot desconectado');
        }
    }
}

// Crear nuestro bot de WhatsApp
const bot = new WhatsAppBot();

// Si alguien presiona Ctrl+C, cerrar el bot de forma segura
process.on('SIGINT', async () => {
    console.log('\nDeteniendo bot...');
    await bot.stop();
    process.exit(0);
});

// Si la computadora se va a apagar, cerrar el bot de forma segura
process.on('SIGTERM', async () => {
    console.log('\nDeteniendo bot...');
    await bot.stop();
    process.exit(0);
});

// Encender el bot y empezar a funcionar
bot.initialize().catch(console.error);