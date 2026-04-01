export interface Satellite {
  name: string;
  color: string;
  alt: number;
  inc: number;
  raan: number;
  period: number;
  velocity: number;
  trueAngle: number;
  estAngle: number;
  clockError: number;
  posError: number;
  maxStale: number;
  driftRate: number;
  gnssDenied: boolean;
  anyIslBlocked: boolean;
  status: string;
}

export interface DenialLine {
  type: string;
  text: string;
}

export interface ISLLink {
  a: string;
  b: string;
  blocked: boolean;
}

export interface OrbitalParam {
  name: string;
  alt: number;
  inc: number;
  raan: number;
  period: number;
}

export interface SimulationState {
  simTime: number;
  timeStr: string;
  running: boolean;
  speed: number;
  numSats: number;
  anyDenial: boolean;
  denialLines: DenialLine[];
  satellites: Satellite[];
  islLinks: ISLLink[];
  staleEstimates: any[];
  errorHistory: any[];
  orbitalParams: OrbitalParam[];
}

export const SAT_COLORS: Record<string, string> = {
  Alpha: "#00d4ff",
  Bravo: "#39ff6e",
  Charlie: "#ff9f1c",
  Delta: "#e040fb",
  Echo: "#ff4466",
};

export function orbitalVelocity(altKm: number): number {
  const GM = 3.986e14;
  const r = (6371 + altKm) * 1e3;
  return Math.sqrt(GM / r) / 1e3;
}
