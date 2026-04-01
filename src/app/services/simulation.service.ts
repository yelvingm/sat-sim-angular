import { Injectable, signal, effect, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SimulationState } from '../models/simulation.model';
import { firstValueFrom, Subject, takeUntil, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulationService implements OnDestroy {
  private readonly apiUrl = 'http://localhost:8420/api';
  private destroy$ = new Subject<void>();
  
  readonly state = signal<SimulationState | null>(null);

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling() {
    timer(0, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe(async () => {
      try {
        const newState = await firstValueFrom(this.http.get<SimulationState>(`${this.apiUrl}/state`));
        this.state.set(newState);
      } catch (e) {
        // Backend might be down
      }
    });
  }

  async sendCommand(action: string, extra: any = {}) {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/control`, { action, ...extra }));
    } catch (e) {
      console.error('Failed to send command', e);
    }
  }

  // Helper methods for common controls
  play() { this.sendCommand('play'); }
  pause() { this.sendCommand('pause'); }
  reset() { this.sendCommand('reset'); }
  setSpeed(value: number) { this.sendCommand('set_speed', { int_value: value }); }
  setSatCount(value: number) { this.sendCommand('set_sat_count', { int_value: value }); }
  toggleGnss(name: string) { this.sendCommand('toggle_gnss', { name }); }
  setDrift(name: string, value: number) { this.sendCommand('set_drift', { name, value }); }
  toggleIsl(name: string, name2: string) { this.sendCommand('toggle_isl', { name, name2 }); }
}
