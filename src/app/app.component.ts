import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SimulationCanvasComponent } from './components/simulation-canvas/simulation-canvas.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { TelemetryPanelComponent } from './components/telemetry-panel/telemetry-panel.component';
import { SimulationService } from './services/simulation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    SimulationCanvasComponent,
    ControlPanelComponent,
    TelemetryPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  simService = inject(SimulationService);
  state = this.simService.state;
}
