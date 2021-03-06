import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable,  } from 'rxjs';

import { AudioService } from 'core/audio.service';
import { Track, TracksService } from 'core/tracks';

import { PlaylistCommands } from 'plugins/playlist';

@Component({
  selector: 'mp-similar-tracks',
  templateUrl: './similarTracks.component.html',
  styleUrls: ['./similarTracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimilarTracksComponent {

  waiting = false;

  loadMore = false;

  tracks: Track[] = [];

  track: Track;

  previewTrack: Track;

  constructor(
    private tracksService: TracksService,
    private playlistCommands: PlaylistCommands,
    private audio: AudioService,
    private cdr: ChangeDetectorRef,
  ) {
    this.audio.track$.subscribe(track => {
      if (!this.previewTrack || track.uri !== this.previewTrack.uri) {
        this.track = track;
        this.findSimilar(track);
      }
    });
  }

  findSimilar(track: Track) {
    this.tracks = [];
    this.waiting = true;

    this.tracksService.findSimilar(track).subscribe(
      tracks => {
        this.tracks = tracks;
        this.cdr.markForCheck();
      },
      () => {},
      () => {
        this.waiting = false;
        this.cdr.markForCheck();
      },
    );
  }

  addToPlaylist(track: Track) {
    this.removeTrackFromResults(track);
    this.playlistCommands.addTrack(Object.assign({}, track));
  }

  setPlayingTrack(track: Track) {
    this.previewTrack = track;
  }

  removeTrackFromResults(track: Track) {
    const trackIndex = this.tracks.indexOf(track);
    if (trackIndex !== -1) {
      this.tracks.splice(trackIndex, 1);
    }
    this.tracks = this.tracks.slice();
    this.cdr.markForCheck();
  }

}
