import mediapipe as mp
import numpy as np
import cv2, math
from collections import deque

class GestureRecognizer:
    def __init__(self):
        self.hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        # history for swipe (index+middle tip avg x)
        self.x_hist = deque(maxlen=8)

    @staticmethod
    def _angle(a,b,c):
        ba=np.array(a)-np.array(b); bc=np.array(c)-np.array(b)
        nba=np.linalg.norm(ba); nbc=np.linalg.norm(bc)
        if nba==0 or nbc==0: return 0.0
        cos=np.dot(ba,bc)/(nba*nbc); cos=np.clip(cos,-1.0,1.0)
        return float(np.degrees(np.arccos(cos)))

    @staticmethod
    def _dist(a,b): return float(np.linalg.norm(np.array(a)-np.array(b)))
    @staticmethod
    def _hand_size(pts):
        xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
        return math.hypot(max(xs)-min(xs), max(ys)-min(ys)) + 1e-6

    def _finger_extended(self, pts, triple, th=162):
        mcp,pip,dip = triple
        return self._angle(pts[mcp], pts[pip], pts[dip]) > th

    def _thumb_extended(self, pts, th=162):
        return self._angle(pts[0], pts[2], pts[3]) > th

    def _classify_pose(self, pts):
        fs = {"index":(5,6,7), "middle":(9,10,11), "ring":(13,14,15), "pinky":(17,18,19)}
        ext = {k:self._finger_extended(pts,v,162) for k,v in fs.items()}
        thumb = self._thumb_extended(pts,162)
        non_thumb = sum(ext.values())
        size = self._hand_size(pts)
        ok_dist = self._dist(pts[4], pts[8]) / size

        if non_thumb >= 4 and thumb: return "Open Palm", 0.97
        if non_thumb == 0 and not thumb: return "Fist", 0.96
        if ext["index"] and ext["middle"] and not ext["ring"] and not ext["pinky"]: return "Peace", 0.94
        if ext["index"] and not ext["middle"] and not ext["ring"] and not ext["pinky"] and not thumb: return "Point Up", 0.92
        if thumb and ext["pinky"] and not ext["index"] and not ext["middle"] and not ext["ring"]: return "Call Me", 0.92
        if ok_dist < 0.12: return "OK", 0.93
        if thumb and non_thumb == 0:
            tip = pts[4]; mcp = pts[2]; dy = tip[1] - mcp[1]
            if dy < -5: return "Thumbs Up", 0.91
            if dy >  5: return "Thumbs Down", 0.91
            return "Thumb (Side)", 0.80
        return f"Fingers: {non_thumb + (1 if thumb else 0)}", 0.6

    def _detect_swipe(self, label):
        # Trigger only in Peace pose for reliability
        if label != "Peace" or len(self.x_hist) < 8:
            return None
        delta = self.x_hist[-1] - self.x_hist[0]
        # require ~15% width of 640 (≈96px) and mostly horizontal
        if abs(delta) > 96:
            self.x_hist.clear()
            return "Swipe Right" if delta > 0 else "Swipe Left"
        return None

    def predict(self, frame_bgr):
        # Expect a MIRRORED frame from the frontend already.
        # But in case it's not mirrored, mirror here to keep left=left.
        # Comment the next line if you handle mirroring only in frontend.
        frame_bgr = cv2.flip(frame_bgr, 1)

        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        res = self.hands.process(rgb)

        label, score = "No Hand", 0.0
        if res.multi_hand_landmarks:
            lm = res.multi_hand_landmarks[0].landmark
            pts = [(int(p.x * w), int(p.y * h)) for p in lm]
            label, score = self._classify_pose(pts)

            idx_tip, mid_tip = pts[8], pts[12]
            avgx = (idx_tip[0] + mid_tip[0]) / 2.0
            self.x_hist.append(avgx)

            swipe = self._detect_swipe(label)
            if swipe:
                return {"label": swipe, "score": 0.95}

        return {"label": label, "score": round(float(score), 3)}
