import {
  Component, ElementRef, ViewChild, inject,
  effect, afterNextRender, HostListener
} from '@angular/core';
import { SimulationService } from '../../services/simulation.service';
import { SAT_COLORS, SimulationState } from '../../models/simulation.model';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  templateUrl: './simulation-canvas.component.html',
  styleUrl: './simulation-canvas.component.css'
})
export class SimulationCanvasComponent {
  @ViewChild('orbitCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private simService = inject(SimulationService);
  private ctx!: CanvasRenderingContext2D;

  constructor() {
    afterNextRender(() => {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resizeCanvas();
    });

    effect(() => {
      const state = this.simService.state();
      if (state && this.ctx) this.drawScene(state);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
    const state = this.simService.state();
    if (state) this.drawScene(state);
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width  = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  /** Pixel dimensions of the shared orbit ellipse.
   *  ry is compressed by cos(inc) to simulate a perspective tilt. */
  private getOrbitDims(canvas: HTMLCanvasElement, incDeg: number) {
    const minDim = Math.min(canvas.width, canvas.height);
    const rx = minDim * 0.38;
    const ry = rx * Math.cos((incDeg * Math.PI) / 180);
    return { rx, ry };
  }

  /** Canvas (x, y) for a point at true anomaly theta on the shared orbit. */
  private getSatXY(
    canvas: HTMLCanvasElement,
    theta: number,
    rx: number,
    ry: number
  ) {
    return {
      x: canvas.width  / 2 + rx * Math.cos(theta),
      y: canvas.height / 2 + ry * Math.sin(theta),
    };
  }

  private drawScene(state: SimulationState): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx    = this.ctx;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(0,180,255,0.03)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const { satellites, islLinks, orbitInfo } = state;
    const cx = W / 2;
    const cy = H / 2;
    const { rx, ry } = this.getOrbitDims(canvas, orbitInfo.inc);

    // Earth
    const earthR   = Math.min(W, H) * 0.08;
    const earthGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, earthR);
    earthGrad.addColorStop(0,   'rgba(30,80,160,0.9)');
    earthGrad.addColorStop(0.6, 'rgba(15,50,100,0.7)');
    earthGrad.addColorStop(1,   'rgba(5,20,50,0.4)');
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle   = earthGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,180,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Atmosphere halo
    const atmGrad = ctx.createRadialGradient(cx, cy, earthR, cx, cy, earthR * 1.3);
    atmGrad.addColorStop(0, 'rgba(0,150,255,0.06)');
    atmGrad.addColorStop(1, 'rgba(0,150,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, earthR * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = atmGrad;
    ctx.fill();

    // Shared orbit ring
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,180,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ISL links
    islLinks.forEach(link => {
      const sa = satellites.find(s => s.name === link.a);
      const sb = satellites.find(s => s.name === link.b);
      if (!sa || !sb) return;
      const posA = this.getSatXY(canvas, sa.trueAngle, rx, ry);
      const posB = this.getSatXY(canvas, sb.trueAngle, rx, ry);
      ctx.setLineDash(link.blocked ? [4, 8] : [2, 5]);
      ctx.strokeStyle = link.blocked
        ? 'rgba(255,204,0,0.3)'
        : 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Satellites
    satellites.forEach(sat => {
      const col     = SAT_COLORS[sat.name];
      const truePos = this.getSatXY(canvas, sat.trueAngle, rx, ry);
      const estPos  = this.getSatXY(canvas, sat.estAngle,  rx, ry);

      // Ghost (estimated position) when error is visible
      if (sat.posError > 0.5) {
        ctx.beginPath();
        ctx.arc(estPos.x, estPos.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = col + '55';
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(truePos.x, truePos.y);
        ctx.lineTo(estPos.x, estPos.y);
        ctx.strokeStyle = 'rgba(255,51,85,0.45)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // True-position dot
      const r = 8;
      ctx.beginPath();
      ctx.arc(truePos.x, truePos.y, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        truePos.x - 2, truePos.y - 2, 0,
        truePos.x,     truePos.y,     r
      );
      grad.addColorStop(0, col + 'ff');
      grad.addColorStop(1, col + '44');
      ctx.fillStyle = grad;
      ctx.fill();

      // GNSS-denial ring
      if (sat.gnssDenied) {
        ctx.beginPath();
        ctx.arc(truePos.x, truePos.y, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,51,85,0.7)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label
      ctx.font      = "bold 10px 'Barlow Condensed', sans-serif";
      ctx.fillStyle = col;
      ctx.fillText(sat.name.toUpperCase(), truePos.x + 12, truePos.y - 6);

      // Error readout
      if (sat.posError > 0.1) {
        ctx.font      = "9px 'Share Tech Mono', monospace";
        ctx.fillStyle = 'rgba(255,51,85,0.9)';
        ctx.fillText(`±${sat.posError.toFixed(1)}m`, truePos.x + 12, truePos.y + 6);
      }
    });
  }
}
