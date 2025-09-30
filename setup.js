#!/usr/bin/env node

/**
 * Este archivo ayuda a configurar el bot por primera vez
 * Solo necesitas ejecutarlo una vez para poner tu clave de OpenAI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    console.log('WhatsApp Bot - Configuracion Inicial\n');
    
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
        const overwrite = await question('El archivo .env ya existe. ¿Deseas sobrescribirlo? (y/N): ');
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
            console.log('Configuracion cancelada.');
            rl.close();
            return;
        }
    }
    
    console.log('Necesitamos configurar las variables de entorno necesarias:\n');
    
    const apiKey = await question('Ingresa tu API Key de OpenAI: ');
    if (!apiKey.trim()) {
        console.log('La API Key es obligatoria. Configuracion cancelada.');
        rl.close();
        return;
    }
    
    const envContent = `# Configuracion de OpenAI
OPENAI_API_KEY=${apiKey}

# Configuracion del Bot
BOT_NAME=WhatsApp Bot
BOT_PREFIX=!

# Configuracion de OpenAI
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7

# Configuracion de mensajes
WELCOME_MESSAGE=Hola! Soy tu asistente de WhatsApp powered by OpenAI. En que puedo ayudarte?
ERROR_MESSAGE=Lo siento, hubo un error procesando tu mensaje. Intentalo de nuevo.`;

    fs.writeFileSync(envPath, envContent);
    
    console.log('\nConfiguracion completada!');
    console.log('Archivo .env creado exitosamente.');
    console.log('\nPara iniciar el bot ejecuta: npm start');
    console.log('Lee el README.md para mas informacion.');
    
    rl.close();
}

setup().catch(console.error);