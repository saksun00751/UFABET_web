interface WinwheelSegmentOptions {
  fillStyle?:      string;
  strokeStyle?:    string;
  lineWidth?:      number;
  text?:           string;
  textFillStyle?:  string;
  textFontSize?:   number;
  image?:          string;
  imageDirection?: "N" | "S" | "E" | "W";
}

interface WinwheelAnimationOptions {
  type?:              string;
  duration?:          number;
  spins?:             number;
  easing?:            string;
  repeat?:            number;
  yoyo?:              boolean;
  propertyName?:      string;
  propertyValue?:     number;
  stopAngle?:         number;
  callbackFinished?:  (segment: WinwheelSegmentOptions) => void;
  callbackAfterEach?: () => void;
}

interface WinwheelOptions {
  canvasId?:       string;
  numSegments?:    number;
  drawMode?:       "code" | "image" | "segmentImage";
  drawText?:       boolean;
  textFontSize?:   number;
  textFillStyle?:  string;
  imageOverlay?:   boolean;
  imageDirection?: "N" | "S" | "E" | "W";
  outerRadius?:    number;
  innerRadius?:    number;
  centerX?:        number;
  centerY?:        number;
  fillStyle?:      string;
  strokeStyle?:    string;
  lineWidth?:      number;
  rotationAngle?:  number;
  pointerAngle?:   number;
  segments?:       WinwheelSegmentOptions[];
  animation?:      WinwheelAnimationOptions;
}

declare class Winwheel {
  constructor(options: WinwheelOptions, drawWheel?: boolean);
  rotationAngle: number;
  animation: WinwheelAnimationOptions;
  segments: Array<WinwheelSegmentOptions & { startAngle: number; endAngle: number }>;
  draw(): void;
  startAnimation(): void;
  stopAnimation(canCallback?: boolean): void;
  getIndicatedSegment(): WinwheelSegmentOptions;
  getIndicatedSegmentNumber(): number;
}

interface Window {
  Winwheel: typeof Winwheel;
}
