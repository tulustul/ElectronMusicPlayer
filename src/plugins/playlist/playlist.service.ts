import { Injectable } from '@angular/core';

import * as jss from 'jss/jss';

import { ReplaySubject } from 'rxjs';

import { AudioService } from 'core/audio.service';
import { Track } from 'core/tracks';
import { formatSeconds } from 'core/utils';
import { NotificationsService } from 'core/notifications';

import { Playlist, PlaylistTracks } from './models';

interface Column {
  displayName: string,
  size: string,
  getter: (track: Track) => any,
}

@Injectable()
export class PlaylistService {

  private _playlist$ = new ReplaySubject<Playlist>(1);
  playlist$ = this._playlist$.asObservable();
  playlist: Playlist = {name: 'New playlist'};

  tracks: Track[] = [];
  private _tracks$ = new ReplaySubject<Track[]>(1);
  tracks$ = this._tracks$.asObservable();

  private _searchFocus$ = new ReplaySubject<void>(1);
  searchFocus$ = this._searchFocus$.asObservable();

  columns: Column[] = [
    {
      displayName: 'Track',
      size: '50px',
      getter: track => track.track,
    }, {
      displayName: 'Title',
      size: '40%',
      getter: track => track.title,
    }, {
      displayName: 'Album',
      size: '20%',
      getter: track => track.album,
    }, {
      displayName: 'Artist',
      size: '20%',
      getter: track => track.artist,
    }, {
      displayName: 'Year',
      size: '50px',
      getter: track => track.year,
    }, {
      displayName: 'Length',
      size: '50px',
      getter: track => formatSeconds(track.length),
    },
  ];

  constructor(
    private audio: AudioService,
    private notifications: NotificationsService,
  ) {
  }

  play(track: Track) {
    this.audio.play(track);
  }

  start() {
    if (this.tracks.length) {
      this.play(this.tracks[0]);
    }
  }

  skipTrackBy(offset: number) {
      let index = this.tracks.indexOf(this.audio.track);
      if (index === -1) {
        this.start();
      } else {
        index += offset;
        if (index < 0 ) {
          index = this.tracks.length - 1;
        } else if (index >= this.tracks.length) {
          index = 0;
        }
        this.play(this.tracks[index]);
      }
  }

  addTrack(track: Track) {
    this.addTracks([track]);
  }

  addTracks(tracks: Track[]) {
    this._updateTracks(this.tracks.concat(tracks))
  }

  clear() {
    this._updateTracks([]);
  }

  async setPlaylist(playlist: Playlist) {
    this.playlist = playlist;
    this._playlist$.next(this.playlist);

    let playlistTracks = await PlaylistTracks.store.get(playlist.id);
    if (playlistTracks) {
      this.tracks = playlistTracks.tracks;
      this._tracks$.next(this.tracks);
    }
  }

  private _updateTracks(tracks: Track[]) {
    this.tracks = tracks;
    this._tracks$.next(this.tracks);
    this._save();
  }

  private _save() {
    if (this.playlist.placeholder === '1') {
      this.playlist.placeholder = '';
      Playlist.store.update(this.playlist.id, this.playlist);
    }
    PlaylistTracks.store.update(this.playlist.id, {
      tracks: this.tracks,
    });
  }

  deleteTrack(track: Track) {
    let index = this.tracks.indexOf(track);
    if (index !== -1) {
      this._updateTracks(this.tracks.splice(index, 1));
    }
  }

  focusSearch() {
    this._searchFocus$.next(null);
  }

}
