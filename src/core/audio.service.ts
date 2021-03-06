import { Subject, ReplaySubject } from 'rxjs';

import { Track } from './tracks';

export interface AudioError {
  message: string;
  description: string;
}

export enum AudioState {
  playing,
  paused,
  stopped,
  buffering,
}

export class AudioService {

  private _state$ = new ReplaySubject<AudioState>(1);
  state$ = this._state$.asObservable();
  state: AudioState;

  private _track$ = new ReplaySubject<Track>(1);
  track$ = this._track$.asObservable();
  track: Track;

  private _position$ = new ReplaySubject<number>(1);
  position$ = this._position$.throttleTime(250);
  position: number;

  private _duration$ = new ReplaySubject<number>(1);
  duration$ = this._duration$.asObservable();
  duration: number;

  private _volume$ = new ReplaySubject<number>(1);
  volume$ = this._volume$.asObservable();

  private _trackend$ = new Subject<void>();
  trackend$ = this._trackend$.asObservable();

  private _playFinish$ = new Subject<{track: Track, playTime: number}>();
  playFinish$ = this._playFinish$.asObservable();

  private _errors$ = new Subject<AudioError>();
  errors$ = this._errors$.asObservable();

  audio = new Audio();

  playStartTimestamp = 0;
  cumulativePlayTime = 0

  isStopped = false;

  constructor() {
    this.volume = 1;

    this.audio.addEventListener('timeupdate', (e: Event) => {
      this.position = this.audio.currentTime;
      this._position$.next(this.position);
    });

    this.audio.addEventListener('loadedmetadata', (e: Event) => {
      if (!this.track.length) {
        this.track.length = this.audio.duration;
        this.duration = this.track.length;
        this._duration$.next(this.duration);
        this._track$.next(this.track);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.end();
    });

    this.audio.addEventListener('waiting', () => {
      this.setState(AudioState.buffering);
    });

    this.audio.addEventListener('pause', () => {
      this.cumulativePlayTime += this.playingTime;
      if (this.isStopped) {
        this.setState(AudioState.stopped);
      } else {
        this.setState(AudioState.paused);
      }
    });

    this.audio.addEventListener('playing', () => {
      this.setState(AudioState.playing);
      this.playStartTimestamp = this.currentTime;
    });

    this.audio.addEventListener('error', () => {
      let error = {
        message: 'Unable to play track',
        description: this.getErrorMessage(this.audio.error.code),
      };
      this._errors$.next(error);
      console.error(`${error.message}: ${error.description}`);
      this.end();
    });
  }

  private end() {
    this.resetTracking();
    this._trackend$.next(null);
  }

  private resetTracking() {
    this.position = 0;
    this.duration = 0;
    this._position$.next(this.position);
    this._duration$.next(this.duration);
  }

  play(track: Track) {
    if (this.track) {
      this._playFinish$.next({
        track: this.track,
        playTime: this.totalPlayingSeconds,
      });
    }

    this.isStopped = false;
    this.stop();

    if (!track) {
      return;
    }

    this.resetTracking();

    this.track = track;
    this._track$.next(this.track);
    if (this.track.length) {
      this._duration$.next(this.track.length);
    }

    this.audio.src = this.track.uri;
    this.audio.load();
    this.audio.play();

    this.cumulativePlayTime = 0;
  }

  stop() {
    this.isStopped = true;

    this.audio.pause();
    this.audio.currentTime = 0;

    this.position = 0;
    this._position$.next(this.position);
  }

  togglePause() {
    this.isStopped = false;
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  seek(position: number) {
    if (this.track) {
      this.audio.currentTime = position;
    }
  }

  seekBy(offset: number) {
    this.seek(this.position + offset);
  }

  set volume(volume: number) {
    volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = volume;
    this._volume$.next(volume);
  }
  get volume() {
    return this.audio.volume;
  }

  private setState(state: AudioState) {
    this.state = state;
    this._state$.next(this.state);
  }

  private getErrorMessage(errorCode: number) {
    return {
      [this.audio.error.MEDIA_ERR_ABORTED]:
        'You aborted the video playback.',
      [this.audio.error.MEDIA_ERR_NETWORK]:
        'A network error caused the audio download to fail.',
      [this.audio.error.MEDIA_ERR_DECODE]:
        'The audio playback was aborted due to a corruption problem or ' +
        'because the video used features your browser did not support.',
      [this.audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED]:
        'The video audio not be loaded, either because the server or ' +
        'network failed or because the format is not supported.',
    }[errorCode] || 'An unknown error occurred.';
  }

  get currentTime() {
    return new Date().getTime();
  }

  get playingTime() {
    return this.currentTime - this.playStartTimestamp;
  }

  get totalPlayingSeconds() {
    return this.playingTime / 1000;
  }

}
