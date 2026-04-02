import { Component, inject, effect, signal, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { SimulationService } from '../../services/simulation.service';
import { SAT_COLORS, SimulationState } from '../../models/simulation.model';

@Component({
  selector: 'app-error-plot',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './error-plot.component.html',
  styleUrl: './error-plot.component.css'
})
export class ErrorPlotComponent {
  @ViewChild(BaseChartDirective) chartRef?: BaseChartDirective;
  private simService = inject(SimulationService);

  readonly chartType = 'line' as const;
  readonly chartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });

  readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          font: { family: 'monospace', size: 9 },
          boxWidth: 12,
          padding: 6,
        },
      },
      title: {
        display: true,
        text: 'STATE ERROR vs TIME (self-reported − true,  metres)',
        color: 'rgba(255,255,255,0.35)',
        font: { family: 'monospace', size: 9 },
        padding: { bottom: 6 },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)} m`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { family: 'monospace', size: 9 },
          maxTicksLimit: 6,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.12)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255,255,255,0.35)',
          font: { family: 'monospace', size: 9 },
          maxTicksLimit: 5,
          callback: v => {
            const n = Number(v);
            return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n < 10 ? n.toFixed(1) : n.toFixed(0);
          },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        border: { color: 'rgba(255,255,255,0.12)' },
      },
    },
  };

  constructor() {
    effect(() => {
      const state = this.simService.state();
      if (state) this.updateChart(state);
    });
  }

  private updateChart(state: SimulationState): void {
    const history = state.errorHistory;
    this.chartData.set({
      labels: history.map(pt => pt.t.toFixed(0) + 's'),
      datasets: state.satellites.map(sat => ({
        label: sat.name,
        data: history.map(pt => pt.errors[sat.name] ?? 0),
        borderColor: SAT_COLORS[sat.name] ?? '#fff',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1.5,
        tension: 0,
      })),
    });
  }
}
