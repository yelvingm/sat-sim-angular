import { Component, ElementRef, ViewChild, AfterViewInit, inject, signal, effect, HostListener } from '@angular/core';
import { SimulationService } from '../../services/simulation.service';
import { SAT_COLORS, SimulationState, OrbitalParam, Satellite } from '../../models/simulation.model';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  templateUrl: './simulation-canvas.component.html',
  styleUrl: './simulation-canvas.component.css'
})
export class SimulationCanvasComponent implements AfterViewInit {
  @ViewChild('orbitCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private simService = inject(SimulationService);
  private ctx!: CanvasRenderingContext2D;

  constructor() {
    effect(() => {
      const state = this.simService.state();
      if (state && this.ctx) {
        this.drawScene(state);
      }
    });
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resizeCanvas();
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
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  private getOrbitRadii(canvas: HTMLCanvasElement, p: OrbitalParam) {
    const minDim = Math.min(canvas.width, canvas.height);
    const base = minDim * 0.32;
    const rx = base + p.alt * 0.06;
    const ry = rx * (0.85 + (p.inc / 180) * 0.15);
    return { rx, ry };
  }

  private getSatXY(canvas: HTMLCanvasElement, p: OrbitalParam, angle: number) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const { rx, ry } = this.getOrbitRadii(canvas, p);
    const raanRad = (p.raan * Math.PI) / 180;
    const x0 = rx * Math.cos(angle);
    const y0 = ry * Math.sin(angle);
    const x = cx + x0 * Math.cos(raanRad) - y0 * Math.sin(raanRad);
    const y = cy + x0 * Math.sin(raanRad) + y0 * Math.cos(raanRad);
    return { x, y };
  }

  private drawScene(state: SimulationState): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = "rgba(0,180,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const { satellites, orbitalParams: params } = state;
    const cx = W / 2;
    const cy = H / 2;

    // Earth
    const earthR = Math.min(W, H) * 0.08;
    const earthGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, earthR);
    earthGrad.addColorStop(0, "rgba(30,80,160,0.9)");
    earthGrad.addColorStop(0.6, "rgba(15,50,100,0.7)");
    earthGrad.addColorStop(1, "rgba(5,20,50,0.4)");
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = earthGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,180,255,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Atmosphere
    const atmGrad = ctx.createRadialGradient(cx, cy, earthR, cx, cy, earthR * 1.3);
    atmGrad.addColorStop(0, "rgba(0,150,255,0.06)");
    atmGrad.addColorStop(1, "rgba(0,150,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, earthR * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = atmGrad;
    ctx.fill();

    // Orbits
    params.forEach(p => {
      const { rx, ry } = this.getOrbitRadii(canvas, p);
      const raanRad = (p.raan * Math.PI) / 180;
      const col = SAT_COLORS[p.name];
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(raanRad);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = col + "22";
      ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke();
      ctx.restore();
    });

    // ISL links
    state.islLinks.forEach(link => {
      const pa = params.find(p => p.name === link.a);
      const pb = params.find(p => p.name === link.b);
      const sa = satellites.find(s => s.name === link.a);
      const sb = satellites.find(s => s.name === link.b);
      if (!pa || !pb || !sa || !sb) return;
      const posA = this.getSatXY(canvas, pa, sa.trueAngle);
      const posB = this.getSatXY(canvas, pb, sb.trueAngle);
      ctx.setLineDash(link.blocked ? [4, 8] : [2, 5]);
      ctx.strokeStyle = link.blocked ? "rgba(255,204,0,0.25)" : "rgba(0,212,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(posA.x, posA.y); ctx.lineTo(posB.x, posB.y); ctx.stroke();
      ctx.setLineDash([]);
    });

    // Satellites
    satellites.forEach(sat => {
      const p = params.find(pp => pp.name === sat.name);
      if (!p) return;
      const col = SAT_COLORS[sat.name];
      const truePos = this.getSatXY(canvas, p, sat.trueAngle);
      const estPos = this.getSatXY(canvas, p, sat.estAngle);

      if (sat.clockError > 0.5) {
        ctx.beginPath(); ctx.arc(estPos.x, estPos.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = col + "55"; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(truePos.x, truePos.y); ctx.lineTo(estPos.x, estPos.y);
        ctx.strokeStyle = "rgba(255,51,85,0.4)"; ctx.stroke();
      }

      const r = 8;
      ctx.beginPath(); ctx.arc(truePos.x, truePos.y, r, 0, Math.PI * 2);
      const satGrad = ctx.createRadialGradient(truePos.x - 2, truePos.y - 2, 0, truePos.x, truePos.y, r);
      satGrad.addColorStop(0, col + "ff"); satGrad.addColorStop(1, col + "44");
      ctx.fillStyle = satGrad; ctx.fill();

      if (sat.gnssDenied) {
        ctx.beginPath(); ctx.arc(truePos.x, truePos.y, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,51,85,0.7)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }

      ctx.font = `bold 10px 'Barlow Condensed', sans-serif`; ctx.fillStyle = col;
      ctx.fillText(sat.name.toUpperCase(), truePos.x + 12, truePos.y - 6);
      if (sat.clockError > 0.1) {
        ctx.font = `9px 'Share Tech Mono', monospace`; ctx.fillStyle = "rgba(255,51,85,0.9)";
        ctx.fillText(`±${sat.clockError.toFixed(1)}m`, truePos.x + 12, truePos.y + 6);
      }
    });
  }
}
