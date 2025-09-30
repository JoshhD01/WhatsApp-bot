import OpenAI from 'openai';
import { Logger } from '../utils/logger.js';

export class OpenAIService {
    constructor() {
        this.logger = new Logger();
        
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY no esta configurada en las variables de entorno');
        }

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
        
        // Aquí guardamos lo que ha dicho cada persona para que el bot recuerde la conversación
        this.conversations = new Map();
    }

    async generateResponse(message, userId) {
        try {
            // Buscar si ya hemos hablado con esta persona antes, si no crear una nueva conversación
            let conversation = this.conversations.get(userId) || [];
            
            // Añadir el nuevo mensaje de la persona a la conversación
            conversation.push({
                role: 'user',
                content: message
            });

            // Si la conversación es muy larga, borrar los mensajes más antiguos para ahorrar dinero
            if (conversation.length > 20) {
                conversation = conversation.slice(-20);
            }

            // Si es la primera vez que habla esta persona, explicarle al bot quién es
            const messages = conversation.length === 1 ? [
                {
                    role: 'system',
                    content: `Eres un asistente util y amigable en WhatsApp. Tu nombre es ${process.env.BOT_NAME || 'WhatsApp Bot'}. Responde de manera concisa y util. Siempre manten un tono amigable y profesional.`
                },
                ...conversation
            ] : conversation;

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
            });

            const response = completion.choices[0].message.content;

            // Añadir la respuesta del bot a la conversación para que la recuerde
            conversation.push({
                role: 'assistant',
                content: response
            });

            // Guardar toda la conversación actualizada en la memoria del bot
            this.conversations.set(userId, conversation);

            return response;
        } catch (error) {
            this.logger.error('Error generando respuesta de OpenAI:', error);
            
            if (error.status === 401) {
                throw new Error('API Key de OpenAI invalida');
            } else if (error.status === 429) {
                throw new Error('Limite de rate limit alcanzado');
            } else if (error.status === 402) {
                throw new Error('Cuota de OpenAI excedida');
            }
            
            throw new Error('Error conectando con OpenAI');
        }
    }

    // Borrar todo lo que el bot recuerda de una conversación (como empezar de cero)
    clearConversation(userId) {
        this.conversations.delete(userId);
        this.logger.info(`Historial limpiado para usuario: ${userId}`);
    }

    // Mostrar cuántas personas están hablando con el bot y cuántos mensajes hay
    getStats() {
        return {
            activeConversations: this.conversations.size,
            totalMessages: Array.from(this.conversations.values())
                .reduce((total, conv) => total + conv.length, 0)
        };
    }
}