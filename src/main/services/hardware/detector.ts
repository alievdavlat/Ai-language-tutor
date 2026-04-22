import si from 'systeminformation'
import type { HardwareProfile, PerformanceMode } from '@shared/types'
import { withTimeout } from '../../utils/with-timeout.js'

const BYTES_PER_GB = 1024 ** 3

function pickPerformanceMode(totalRamGB: number, gpuVramMB: number): PerformanceMode {
  if (gpuVramMB >= 7500 && totalRamGB >= 15) return 'quality'
  if (totalRamGB >= 12 && gpuVramMB >= 1500) return 'balanced'
  return 'fast'
}

export async function detectHardware(): Promise<HardwareProfile> {
  const [mem, cpu, graphics, osInfo] = await Promise.all([
    withTimeout(
      si.mem(),
      2000,
      { total: 8 * BYTES_PER_GB, available: 4 * BYTES_PER_GB } as si.Systeminformation.MemData
    ),
    withTimeout(
      si.cpu(),
      2000,
      {
        manufacturer: 'Unknown',
        brand: 'CPU',
        physicalCores: 4,
        speed: 2.0
      } as si.Systeminformation.CpuData
    ),
    withTimeout(
      si.graphics(),
      3000,
      { controllers: [], displays: [] } as si.Systeminformation.GraphicsData
    ),
    withTimeout(si.osInfo(), 2000, { platform: process.platform } as si.Systeminformation.OsData)
  ])

  const primaryGpu = graphics.controllers[0]
  const totalRamGB = +(mem.total / BYTES_PER_GB).toFixed(2)
  const gpuVramMB = primaryGpu?.vram ?? 0

  return {
    totalRamGB,
    freeRamGB: +(mem.available / BYTES_PER_GB).toFixed(2),
    cpuModel: `${cpu.manufacturer} ${cpu.brand}`.trim(),
    cpuCores: cpu.physicalCores ?? 4,
    cpuSpeedGHz: cpu.speed ?? 0,
    gpuVendor: primaryGpu?.vendor ?? 'unknown',
    gpuModel: primaryGpu?.model ?? 'integrated / unknown',
    gpuVramMB,
    platform: osInfo.platform ?? process.platform,
    recommendedMode: pickPerformanceMode(totalRamGB, gpuVramMB)
  }
}
