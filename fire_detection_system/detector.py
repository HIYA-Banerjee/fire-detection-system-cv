try:
    import cv2
    import numpy as np
    HAS_CV2_NUMPY = True
except ImportError:
    HAS_CV2_NUMPY = False


class FireSmokeDetector:
    """
    Fire and Smoke Detection class.
    Uses YOLOv8 if available, otherwise falls back to color-based detection.
    """

    def __init__(self, model_path='yolov8n.pt', conf_threshold=0.6):
        """
        Initialize the detector.

        Args:
            model_path (str): Path to the YOLO model weights file
            conf_threshold (float): Confidence threshold for detections
        """
        self.conf_threshold = conf_threshold
        self.model = None
        self.using_yolo = False
        
        if not HAS_CV2_NUMPY:
            print("[INFO] cv2/numpy not available - running in mock mode")
            return
            
        # Try to load YOLOv8
        try:
            import torch
            # Monkey-patch torch.load to disable default weights_only in PyTorch 2.6+
            if hasattr(torch, 'load'):
                _orig_load = torch.load
                def _patched_load(*args, **kwargs):
                    if 'weights_only' not in kwargs:
                        kwargs['weights_only'] = False
                    return _orig_load(*args, **kwargs)
                torch.load = _patched_load

            from ultralytics import YOLO
            self.model = YOLO(model_path)
            self.using_yolo = True
            print(f"[OK] YOLO model loaded: {model_path}")
        except ImportError:
            print("[INFO] ultralytics not installed - using color-based detection fallback")
            print("[INFO] For AI detection: pip install ultralytics torch")
        except Exception as e:
            print(f"[WARN] Could not load YOLO model: {e}")
            print("[INFO] Using color-based detection fallback")

    def detect(self, frame):
        """
        Perform detection on a single frame.

        Args:
            frame: Input frame from webcam (BGR numpy array)

        Returns:
            tuple: (annotated_frame, fire_detected, smoke_detected, detections_list)
        """
        if not HAS_CV2_NUMPY:
            return frame, False, False, []
            
        if self.using_yolo and self.model is not None:
            return self._detect_yolo(frame)
        else:
            return self._detect_color(frame)

    def _detect_yolo(self, frame):
        """YOLOv8-based detection"""
        results = self.model(frame, conf=self.conf_threshold, verbose=False)

        fire_detected = False
        smoke_detected = False
        detections = []

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    cls = int(box.cls[0].cpu().numpy())

                    if isinstance(self.model.names, dict):
                        class_name = self.model.names.get(cls, f'class_{cls}')
                    else:
                        class_name = str(self.model.names[cls]) if cls < len(self.model.names) else f'class_{cls}'

                    detections.append((class_name, conf))

                    class_lower = class_name.lower()
                    if 'fire' in class_lower:
                        color = (0, 0, 255)
                        fire_detected = True
                    elif 'smoke' in class_lower:
                        color = (0, 255, 255)
                        smoke_detected = True
                    else:
                        color = (0, 255, 0)

                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    label = f"{class_name}: {conf:.2f}"
                    label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                    cv2.rectangle(frame,
                                  (int(x1), int(y1) - label_size[1] - 10),
                                  (int(x1) + label_size[0], int(y1)),
                                  color, -1)
                    cv2.putText(frame, label, (int(x1), int(y1) - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        return frame, fire_detected, smoke_detected, detections

    def _detect_color(self, frame):
        """Fallback color-based fire/smoke detection"""
        fire_detected = False
        smoke_detected = False
        detections = []

        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Fire detection - red/orange/yellow colors
        # Lower red range
        lower_fire1 = np.array([0, 100, 100])
        upper_fire1 = np.array([10, 255, 255])
        mask_fire1 = cv2.inRange(hsv, lower_fire1, upper_fire1)
        
        # Upper red range
        lower_fire2 = np.array([160, 100, 100])
        upper_fire2 = np.array([180, 255, 255])
        mask_fire2 = cv2.inRange(hsv, lower_fire2, upper_fire2)
        
        # Orange/yellow range
        lower_fire3 = np.array([10, 100, 100])
        upper_fire3 = np.array([35, 255, 255])
        mask_fire3 = cv2.inRange(hsv, lower_fire3, upper_fire3)
        
        # Combine fire masks
        fire_mask = cv2.bitwise_or(mask_fire1, mask_fire2)
        fire_mask = cv2.bitwise_or(fire_mask, mask_fire3)
        
        # Smoke detection - gray/white colors
        lower_smoke = np.array([0, 0, 150])
        upper_smoke = np.array([180, 50, 255])
        smoke_mask = cv2.inRange(hsv, lower_smoke, upper_smoke)

        # Find fire contours
        fire_contours, _ = cv2.findContours(fire_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in fire_contours:
            area = cv2.contourArea(cnt)
            if area > 500:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(cnt)
                conf = min(area / 5000, 0.95)  # Fake confidence based on area
                if conf >= self.conf_threshold:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    label = f"fire: {conf:.2f}"
                    cv2.putText(frame, label, (x, y - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    detections.append(("fire", conf))
                    fire_detected = True

        # Find smoke contours
        smoke_contours, _ = cv2.findContours(smoke_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in smoke_contours:
            area = cv2.contourArea(cnt)
            if area > 1000:
                x, y, w, h = cv2.boundingRect(cnt)
                conf = min(area / 10000, 0.90)
                if conf >= self.conf_threshold:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 255), 2)
                    label = f"smoke: {conf:.2f}"
                    cv2.putText(frame, label, (x, y - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                    detections.append(("smoke", conf))
                    smoke_detected = True

        # Add fallback indicator
        cv2.putText(frame, "[FALLBACK MODE - Color Detection]", (10, frame.shape[0] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return frame, fire_detected, smoke_detected, detections

