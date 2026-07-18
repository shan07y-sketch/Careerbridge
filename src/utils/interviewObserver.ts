/**
 * Interview participation observer: reports OBSERVABLE events only (face
 * visible/lost, multiple faces, camera disconnects, window focus changes,
 * long idle periods). It never makes fraud or cheating claims -- events are
 * stored verbatim and summarized factually in the report.
 *
 * Face detection uses the experimental FaceDetector API where available
 * (Chrome/Edge); elsewhere only stream / focus / idle events are reported,
 * which keeps this Capacitor-compatible (a native detector can be plugged in
 * later behind the same callback contract).
 */

export type ObservationType =
  | 'face_detected'
  | 'face_lost'
  | 'multiple_faces'
  | 'camera_disconnected'
  | 'camera_denied'
  | 'looking_away'
  | 'window_blur'
  | 'window_focus'
  | 'idle'
  | 'camera_enabled'
  | 'camera_disabled';

export interface InterviewObserverOptions {
  video: HTMLVideoElement | null;
  stream: MediaStream | null;
  onObservation: (type: ObservationType, detail?: string) => void;
  /** Seconds of no activity (no speech updates reported) before an idle event. */
  idleThresholdSec?: number;
}

export class InterviewObserver {
  private opts: InterviewObserverOptions;
  private faceTimer: number | null = null;
  private idleTimer: number | null = null;
  private lastActivityAt = Date.now();
  private lastFaceState: 'unknown' | 'one' | 'none' | 'many' = 'unknown';
  private detector: any = null;
  private stopped = false;

  private readonly handleBlur = () => this.opts.onObservation('window_blur');
  private readonly handleFocus = () => this.opts.onObservation('window_focus');
  private readonly handleVisibility = () => {
    if (document.hidden) this.opts.onObservation('window_blur', 'tab hidden');
  };

  constructor(opts: InterviewObserverOptions) {
    this.opts = { idleThresholdSec: 90, ...opts };
  }

  start(): void {
    this.stopped = false;
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleVisibility);

    const videoTrack = this.opts.stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        if (!this.stopped) this.opts.onObservation('camera_disconnected');
      });
      this.opts.onObservation('camera_enabled');
    }

    const FaceDetectorCtor = (window as any).FaceDetector;
    if (FaceDetectorCtor && this.opts.video && videoTrack) {
      try {
        this.detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 3 });
        this.faceTimer = window.setInterval(() => void this.checkFaces(), 5000);
      } catch {
        this.detector = null;
      }
    }

    this.idleTimer = window.setInterval(() => {
      const idleSec = (Date.now() - this.lastActivityAt) / 1000;
      if (idleSec >= (this.opts.idleThresholdSec ?? 90)) {
        this.opts.onObservation('idle', `${Math.round(idleSec)}s without activity`);
        this.lastActivityAt = Date.now();
      }
    }, 15000);
  }

  /** Call whenever the candidate is actively doing something (speaking, typing). */
  markActivity(): void {
    this.lastActivityAt = Date.now();
  }

  private async checkFaces(): Promise<void> {
    const video = this.opts.video;
    if (!this.detector || !video || video.readyState < 2 || this.stopped) return;
    try {
      const faces = await this.detector.detect(video);
      const state = faces.length === 0 ? 'none' : faces.length === 1 ? 'one' : 'many';
      if (state !== this.lastFaceState) {
        if (state === 'none' && this.lastFaceState !== 'unknown') this.opts.onObservation('face_lost');
        if (state === 'one') this.opts.onObservation('face_detected');
        if (state === 'many') this.opts.onObservation('multiple_faces', `${faces.length} faces in frame`);
        this.lastFaceState = state;
      }
    } catch {
      /* FaceDetector can throw while the video is settling -- skip this tick. */
    }
  }

  stop(): void {
    this.stopped = true;
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    if (this.faceTimer) window.clearInterval(this.faceTimer);
    if (this.idleTimer) window.clearInterval(this.idleTimer);
    this.faceTimer = null;
    this.idleTimer = null;
    this.detector = null;
  }
}
