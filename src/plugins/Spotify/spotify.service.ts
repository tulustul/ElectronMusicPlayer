import { Injectable } from '@angular/core';
import {
  Http,
  Headers,
  RequestOptions,
  URLSearchParams,
} from '@angular/http';

import * as SpotifyWebApi from 'spotify-web-api-js';

import { TracksStore, Track, TrackContainer } from 'core/tracks';
import { PLUGGINS_DATA } from 'core/plugging';
import { Settings } from 'core/settings.service';

@Injectable()
export class SpotifyStore implements TracksStore {

  PAGE_SIZE = 30;

  name = 'Spotify';

  api = new SpotifyWebApi();

  enabled = false;

  CLIENT_ID = 'b84a84d7dc7f46d5836ef223b7ea5703';
  CLIENT_SECRET = '0d29fe1936034265a48301b57f07d1ed';

  proxyServerPort: number;

  authToken = new Buffer(
    `${this.CLIENT_ID}:${this.CLIENT_SECRET}`
  ).toString('base64')

  constructor(
    private http: Http,
    private settings: Settings,
  ) {}

  init() {
    const login = this.settings['spotify.login'];
    const password = this.settings['spotify.password'];


    this.proxyServerPort = this.settings['proxyServerPort'];

    this.enabled = login && password;

    if (this.enabled) {
      PLUGGINS_DATA.proxyServerParams.push(`--spotify-login=${login}`);
      PLUGGINS_DATA.proxyServerParams.push(`--spotify-password=${password}`);
      this.authorize();
    }
  }

  authorize() {
    return new Promise<void>((resolve, reject) => {
      const headers = new Headers({
          'Authorization': 'Basic ' + this.authToken,
          grant_type: 'client_credentials',
      });

      const requestOptions = new RequestOptions({
        headers,
      });

      const body = new URLSearchParams('grant_type=client_credentials');

      this.http.post(
        'https://accounts.spotify.com/api/token',
        body,
        requestOptions,
      ).map(response => response.json()).subscribe(data => {
        this.api.setAccessToken(data.access_token);
        resolve();
      });
    });
  }

  search(term: string, page: number) {
    return new Promise<Track[]>(async (resolve, reject) => {
      if (!this.enabled) {
        resolve([]);
        return;
      }

      let response;
      try {
        response = await this.searchTracks(term, page);
      } catch (e) {
        if (e.status === 401) {
          await this.authorize();
          response = await this.searchTracks(term, page);
        }
      }

      let _tracks = response.tracks.items;

      let tracks: Track[] = _tracks.map(t => {
        let port = this.settings['proxyServerPort'];
        return <Track>{
          uri: `http://localhost:${port}/spotify/${t.uri}`,
          title: t.name,
          album: t.album.name,
          artist: t.artists.map(a => a.name).join(', '),
          length: t.duration_ms / 1000,
          artworkUri: t.album.images.length ? t.album.images[0].url : '',
          track: t.track_number.toString(),
          source: 'spotify',
          sourceId: t.id,
        };
      });

      resolve(tracks);
    });
  }

  private searchTracks(term: string, page: number) {
    return this.api.searchTracks(term, {
      offset: this.PAGE_SIZE * page,
      limit: this.PAGE_SIZE,
    });
  }

  async findSimilar(track: Track) {
    return new Promise<Track[]>(async (resolve, reject) => {
      let sourceId;
      if (track.source === 'spotify') {
        sourceId = track.sourceId;
      } else {
        const searchTerm = `${track.artist} ${track.album} ${track.title}`;
        const tracks = await this.search(searchTerm, 0);
        if (tracks.length) {
          sourceId = tracks[0].sourceId;
        }
      }

      if (!sourceId) {
        resolve([]);
        return;
      }

      let response;
      try {
        response = await this.getRecommendations(sourceId);
      } catch(e) {
        if (e.status === 401) {
          await this.authorize();
          response = await this.getRecommendations(sourceId);
        }
      }

      const tracks: Track[] = response.tracks.map(t => this.mapTrack(t));

      resolve(tracks);
    });
  }

  private mapTrack(spotifyTrack: SpotifyApi.TrackObjectSimplified, isChild=false) {
    return <Track>{
      uri: `http://localhost:${this.proxyServerPort}/spotify/${spotifyTrack.uri}`,
      title: spotifyTrack.name,
      album: '',
      artist: spotifyTrack.artists.map(a => a.name).join(', '),
      length: spotifyTrack.duration_ms / 1000,
      artworkUri: '',
      track: spotifyTrack.track_number.toString(),
      source: 'spotify',
      sourceId: spotifyTrack.id,
    };
  }

  async searchAlbums(term: string, page = 0) {
    return new Promise<TrackContainer[]>(async (resolve, reject) => {
      const response = await this.api.searchAlbums(term);
      const albums = await Promise.all(
        response.albums.items.map(p => this.searchPlaylistTracks(p))
      );
      resolve(Array.prototype.concat.apply([], albums));
    });
  }

  private searchPlaylistTracks(playlist: SpotifyApi.AlbumObjectSimplified) {
    return new Promise<TrackContainer>(async (resolve, reject) => {
      const response = await this.api.getAlbumTracks(playlist.id);
      const tracks = response.items.map(t => this.mapTrack(t, true));
      resolve(<TrackContainer>{
        name: playlist.name,
        artworkUri: playlist.images ? playlist.images[0].url : '',
        tracks: tracks,
        expanded: false,
      });
    });
  }

  private getRecommendations(sourceId: string) {
    return this.api.getRecommendations({
      seed_tracks: sourceId,
    });
  }

}
