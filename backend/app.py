from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "No hay mensajes"}), 400

    def generate():
        try:
            stream = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "Eres un asistente útil y amigable. Responde siempre en el mismo idioma que el usuario."},
                    *messages
                ],
                max_tokens=1024,
                stream=True
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)