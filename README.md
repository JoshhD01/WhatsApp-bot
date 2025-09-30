# WhatsApp Bot con OpenAI

Un chatbot inteligente para WhatsApp que utiliza la API de OpenAI para generar respuestas automaticas y naturales.

## Caracteristicas

- Integracion completa con WhatsApp usando Baileys
- Respuestas inteligentes usando OpenAI GPT
- Historial de conversaciones por usuario
- Comandos personalizables
- Soporte para grupos e individuales
- Autenticacion persistente
- Estadisticas de uso

## Requisitos Previos

- Node.js 16 o superior
- Una API Key de OpenAI
- Un número de teléfono con WhatsApp

## Instalacion

1. **Clonar/descargar el proyecto** (ya tienes esto listo)

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y configura tu API Key de OpenAI:
   ```env
   OPENAI_API_KEY=tu_api_key_aqui
   ```

4. **Iniciar el bot:**
   ```bash
   npm start
   ```

5. **Escanear codigo QR:**
   - Abre WhatsApp en tu telefono
   - Ve a Configuracion > Dispositivos vinculados
   - Escanea el codigo QR que aparece en la terminal

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `!help` | Muestra la lista de comandos |
| `!clear` | Limpia el historial de conversación |
| `!stats` | Muestra estadísticas del bot |
| `!ping` | Verifica el estado del bot |

## Estructura del Proyecto

```
WhatsApp-bot/
├── src/
│   ├── services/
│   │   └── openai.js          # Servicio de OpenAI
│   └── utils/
│       ├── messageHandler.js  # Manejador de mensajes
│       └── logger.js          # Sistema de logging
├── auth/                      # Datos de autenticación (se genera automáticamente)
├── index.js                   # Archivo principal
├── .env                       # Variables de entorno
└── package.json              # Configuración del proyecto
```

## Configuracion

### Variables de Entorno

```env
# OpenAI
OPENAI_API_KEY=           # Tu API Key de OpenAI (REQUERIDA)
OPENAI_MODEL=gpt-3.5-turbo # Modelo a usar
OPENAI_MAX_TOKENS=150     # Máximo de tokens por respuesta
OPENAI_TEMPERATURE=0.7    # Creatividad (0-1)

# Bot
BOT_NAME=WhatsApp Bot     # Nombre del bot
BOT_PREFIX=!              # Prefijo para comandos

# Mensajes
WELCOME_MESSAGE=          # Mensaje de bienvenida
ERROR_MESSAGE=            # Mensaje de error
```

## Scripts NPM

- `npm start` - Inicia el bot
- `npm run dev` - Inicia en modo desarrollo (con watch)

## Personalizacion

### Agregar Nuevos Comandos

Edita `src/utils/messageHandler.js` y agrega tu comando en el objeto `commands`:

```javascript
this.commands = {
    // ... comandos existentes
    tucomando: this.handleTuComando.bind(this),
};

async handleTuComando(userId, sock, args, userName) {
    await sock.sendMessage(userId, { text: '¡Tu respuesta aquí!' });
}
```

### Modificar el Comportamiento de OpenAI

Edita `src/services/openai.js` para cambiar el prompt del sistema o la lógica de respuesta.

## Solucion de Problemas

### El bot no se conecta
- Verifica que tienes conexion a internet
- Asegurate de que WhatsApp Web funciona en tu navegador
- Borra la carpeta `auth` y vuelve a escanear el QR

### Errores de OpenAI
- Verifica que tu API Key es correcta
- Revisa que tienes creditos disponibles en tu cuenta de OpenAI
- Comprueba que el modelo especificado esta disponible

### El bot no responde
- Revisa los logs en la consola
- Verifica que el archivo `.env` esta configurado correctamente
- Asegurate de que el bot esta conectado (debe mostrar "Bot conectado exitosamente!")

## Logs

El bot incluye un sistema de logging colorizado que muestra:
- INFO: Informacion general
- ERROR: Errores
- WARN: Advertencias
- SUCCESS: Operaciones exitosas

## Seguridad

- **NUNCA** compartas tu archivo `.env` o tu API Key
- La carpeta `auth` contiene datos sensibles, no la subas a repositorios publicos
- Considera implementar rate limiting para evitar abuso

## Licencia

ISC License - Libre para uso personal y comercial.

---

Disfruta tu nuevo bot de WhatsApp!