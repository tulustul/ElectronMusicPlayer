import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { Settings } from './settings.service';
import { Theme } from './theme.service';
import { Keybindings } from './keybindings.service';
import { CommandRunner, CoreCommands } from './commands';
import { AudioService } from './audio.service';
import { VirtualRepeater } from './virtualRepeater';
import { FilterService } from './filter.service';
import { ProxyServerService } from './proxyServer.service';
import { BackgroundSliderComponent } from './backgroundSlider';
import { SidebarComponent } from './sidebar';
import { PaletteComponent, PaletteService } from './palette';
import { TracksService } from './tracks';
import { ModalsService, ModalComponent } from './modals';
import { ListComponent, ListService, ListCommands } from './list';
import {
  NotificationsComponent,
  NotificationsService,
} from './notifications';

@NgModule({
  imports: [
    HttpModule,
    CommonModule,
    FormsModule,
  ],
  declarations: [
    VirtualRepeater,
    BackgroundSliderComponent,
    SidebarComponent,
    PaletteComponent,
    ModalComponent,
    NotificationsComponent,
    ListComponent,
  ],
  providers: [
    Settings,
    Theme,
    Keybindings,
    CommandRunner,
    AudioService,
    PaletteService,
    TracksService,
    ModalsService,
    NotificationsService,
    CoreCommands,
    ListService,
    ListCommands,
    FilterService,
    ProxyServerService,
  ],
  exports: [
    VirtualRepeater,
    BackgroundSliderComponent,
    SidebarComponent,
    PaletteComponent,
    ModalComponent,
    NotificationsComponent,
    ListComponent,
  ],
})
export class CoreModule { }