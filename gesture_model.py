import cv2
import numpy as np

class GestureRecognizer:
    def __init__(self):
        # Attempt to load a Haar Cascade for hand detection (if available)
        cascade_path = cv2.data.haarcascades + 'aGest.xml'
        self.hand_cascade = cv2.CascadeClassifier(cascade_path)
        if self.hand_cascade.empty():
            print("⚠️ Haar cascade for hand detection not found. Using fallback contour detection.")

    def predict(self, frame):
        # Convert frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Try to detect hands
        if not self.hand_cascade.empty():
            hands = self.hand_cascade.detectMultiScale(gray, 1.1, 4)
            if len(hands) > 0:
                return {"gesture": "hand_detected", "count": len(hands)}
            else:
                return {"gesture": "no_hand"}
        else:
            # Fallback using contour detection
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(blur, 60, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            if len(contours) > 0:
                return {"gesture": "object_detected", "count": len(contours)}
            return {"gesture": "none"}

# Example usage:
# recognizer = GestureRecognizer()
# result = recognizer.predict(frame)
