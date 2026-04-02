import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SimulationService } from '../../services/simulation.service';
import { SatErrorPlotComponent } from '../sat-error-plot/sat-error-plot.component';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
    MatIconModule,
    SatErrorPlotComponent,
  ],
  templateUrl: './telemetry-panel.component.html',
  styleUrl: './telemetry-panel.component.css'
})
export class TelemetryPanelComponent {
  simService = inject(SimulationService);
  state = this.simService.state;

  getSatStatusClass(status: string): string {
    switch (status) {
      case 'NOMINAL': return 'status-ok';
      case 'GNSS DENY': return 'status-warn';
      case 'ISL CUT': return 'status-warn';
      case 'COMPOUND': return 'status-error';
      default: return '';
    }
  }
}
