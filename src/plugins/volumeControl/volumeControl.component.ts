import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { AudioService } from 'core/audio.service';

@Component({
  selector: 'mp-volume-control',
  templateUrl: './volumeControl.component.html',
  styleUrls: ['./volumeControl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeControlComponent {

  volume: number;

  constructor(
    private audio: AudioService,
    cdr: ChangeDetectorRef,
  ) {
    this.audio.volume$.subscribe(volume => {
      this.volume = volume * 100;
      cdr.markForCheck();
    });
  }

  setVolume(volume: number) {
    this.audio.volume = volume / 100;
    this.volume = volume;
  }

  get formattedVolume() {
    return this.volume.toFixed(0);
  }

  get volumeIcon() {
    if (this.volume > 70) {
      return 'volume_up';
    } else if (this.volume > 25) {
      return 'volume_down';
    } else if (this.volume > 0) {
      return 'volume_mute';
    } else {
      return 'volume_off';
    }
  }

}
