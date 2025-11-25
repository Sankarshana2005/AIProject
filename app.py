from flask import Flask, render_template, request, jsonify
import cv2, base64, numpy as np
from gesture_model import GestureRecognizer

app = Flask(__name__)
recognizer = GestureRecognizer()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    if "image" not in data:
        return jsonify({"error":"no image"}), 400
    b64 = data["image"].split(",")[-1]
    img_bytes = base64.b64decode(b64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    result = recognizer.predict(frame)
    return jsonify(result)

if __name__ == "__main__":
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    print(f"\n🚀 Neon Gestures X running locally at: http://127.0.0.1:5000")
    print(f"🌐 Accessible on your network at: http://{local_ip}:5000\n")
    app.run(host="0.0.0.0", port=5000)

