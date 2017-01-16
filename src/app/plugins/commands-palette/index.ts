import { NgModule } from '@angular/core';

import { MODULES } from 'app/plugging';
import { CoreModule } from 'app/core.module';
import { Commands } from './commands';

@NgModule({
  imports: [CoreModule],
  providers: [Commands],
})
export class CommandPaletteModule { }

MODULES.push(CommandPaletteModule);
