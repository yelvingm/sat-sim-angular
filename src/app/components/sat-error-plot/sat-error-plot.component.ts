import { Component, Input, inject, effect, signal, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { SimulationService } from '../../services/simulation.service';
import { SAT_COLORS, SimulationState } from '../../models/simulation.model';

@Component({
  selector: 'app-sat-error-plot',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './sat-error-plot.component.html',
  styleUrl: './sat-error-plot.component.css',
})
export class SatErrorPlotComponent {
  @Input() satName!: string;
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
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.55)',
          font: { family: 'monospace', size: 7 },
          boxWidth: 10,
          padding: 5,
          // Show all entries including those with zero values
          filter: () => true,
        },
      },
      title: {
        display: true,
        // Two-line title: first line is the legend key
        text: ['solid: my estimate of others   dashed: others\' estimate of me'],
        color: 'rgba(255,255,255,0.25)',
        font: { family: 'monospace', size: 7 },
        padding: { top: 2, bottom: 4 },
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
          color: 'rgba(255,255,255,0.3)',
          font: { family: 'monospace', size: 7 },
          maxTicksLimit: 5,
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255,255,255,0.3)',
          font: { family: 'monospace', size: 7 },
          maxTicksLimit: 4,
          callback: v => {
            const n = Number(v);
            return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n < 10 ? n.toFixed(1) : n.toFixed(0);
          },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  constructor() {
    effect(() => {
      const state = this.simService.state();
      if (state && this.satName) this.updateChart(state);
    });
  }

  private updateChart(state: SimulationState): void {
    const history = state.errorHistory;
    const peers = state.satellites.map(s => s.name).filter(n => n !== this.satName);
    const labels = history.map(pt => pt.t.toFixed(0) + 's');

    const datasets: ChartDataset<'line'>[] = [];

    // Self-reported error: how wrong is this satellite's own position estimate
    datasets.push({
      label: 'SELF',
      data: history.map(pt => pt.errors[this.satName] ?? 0),
      borderColor: SAT_COLORS[this.satName] ?? '#fff',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0,
      borderDash: [],
    });

    // This satellite's estimate of each peer (dead-reckoning error when ISL is cut)
    // Solid thin line in the peer's color.
    for (const peer of peers) {
      datasets.push({
        label: `→${peer.slice(0, 3).toUpperCase()}`,
        data: history.map(pt => pt.peerErrors?.[this.satName]?.[peer] ?? 0),
        borderColor: SAT_COLORS[peer] ?? '#fff',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
        borderDash: [],
      });
    }

    // Each peer's estimate of this satellite (how well others track this sat)
    // Dashed thin line in the peer's color.
    for (const peer of peers) {
      datasets.push({
        label: `${peer.slice(0, 3).toUpperCase()}→`,
        data: history.map(pt => pt.peerErrors?.[peer]?.[this.satName] ?? 0),
        borderColor: SAT_COLORS[peer] ?? '#fff',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
        borderDash: [4, 3],
      });
    }

    this.chartData.set({ labels, datasets });
    this.chartRef?.update();
  }
}
