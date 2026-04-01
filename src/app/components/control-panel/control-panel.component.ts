import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { SimulationService } from '../../services/simulation.service';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.css'
})
export class ControlPanelComponent {
  simService = inject(SimulationService);
  state = this.simService.state;

  togglePlay() {
    if (this.state()?.running) {
      this.simService.pause();
    } else {
      this.simService.play();
    }
  }

  reset() {
    this.simService.reset();
  }

  setSpeed(speed: any) {
    this.simService.setSpeed(parseInt(speed.value));
  }

  setSatCount(count: any) {
    this.simService.setSatCount(parseInt(count.value));
  }

  toggleGnss(name: string) {
    this.simService.toggleGnss(name);
  }

  updateDrift(name: string, event: any) {
    this.simService.setDrift(name, event.target.value);
  }

  toggleIsl(name: string, other: string) {
    this.simService.toggleIsl(name, other);
  }

  trackBySatName(_: number, sat: any): string {
    return sat.name;
  }

  isIslBlocked(name: string, other: string): boolean {
    const link = this.state()?.islLinks.find(l => 
      (l.a === name && l.b === other) || (l.a === other && l.b === name)
    );
    return !!link?.blocked;
  }
}
