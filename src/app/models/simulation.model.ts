export interface Satellite {
  name: string;
  color: string;
  velocity: number;
  trueAngle: number;
  estAngle: number;
  thetaError: number;   // rad, signed (θ_est − θ_true)
  clockError: number;   // m – GNSS time-drift contribution
  islError: number;     // m – ISL dead-reckoning contribution
  posError: number;     // m – total |θ_err| · r
  maxStale: number;     // s – continuous ISL blockout duration
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

export interface OrbitInfo {
  alt: number;      // km
  inc: number;      // deg
  raan: number;     // deg
  period: number;   // s
  velocity: number; // km/s
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
  orbitInfo: OrbitInfo;
  errorHistory: {
    t: number;
    errors: Record<string, number>;
    peerErrors?: Record<string, Record<string, number>>;
  }[];
}

export const SAT_COLORS: Record<string, string> = {
  Alpha:   '#00d4ff',
  Bravo:   '#39ff6e',
  Charlie: '#ff9f1c',
  Delta:   '#e040fb',
  Echo:    '#ff4466',
};
