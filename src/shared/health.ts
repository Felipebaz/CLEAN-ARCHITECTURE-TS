export type HealthStatus = 'ok';



export function checkHealth(status: string = 'ok'): { status: HealthStatus; timestamp: Date } {
  return {
    status: 'ok',
    timestamp: new Date()
  };
}
