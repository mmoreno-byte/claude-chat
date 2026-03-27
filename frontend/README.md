# ✦ Claude Chat

Chat con IA estilo ChatGPT construido con Python + Flask en el backend y React en el frontend.

## ✨ Características
- Chat con IA usando el modelo Llama 3.3 de Groq (gratuito)
- Historial de conversaciones múltiples
- Renderizado de Markdown en las respuestas
- Diseño oscuro estilo ChatGPT
- Sugerencias de preguntas en pantalla inicial
- Botón para limpiar conversación

## 🛠️ Tecnologías
- **Backend**: Python, Flask, Groq API
- **Frontend**: React, Vite, react-markdown

## 📦 Instalación local

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # añade tu GROQ_API_KEY
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Variables de entorno
Crea un archivo `.env` en la carpeta `backend`:
```
GROQ_API_KEY=tu_api_key_de_groq
```

Obtén tu API key gratuita en [console.groq.com](https://console.groq.com)

## 👤 Autora
mmorenodev — [GitHub](https://github.com/mmoreno-byte) · [Portfolio](https://mmoreno-byte.github.io/mmorenodev/)