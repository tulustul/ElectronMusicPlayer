import { NgModule } from '@angular/core';

import { Plugin } from 'core/plugging';
import { CoreModule } from 'core/core.module';

import { SoundCloudStore } from './soundCloud.service';

@Plugin({
  trackStores: [
    SoundCloudStore,
  ],
  settings: [
    {
      key: 'search.soundcloud',
      displayName: 'SoundCloud enabled',
      component: 'checkbox',
    },
  ],
})
@NgModule({
  imports: [CoreModule],
  providers: [SoundCloudStore],
})
export class Module { }
