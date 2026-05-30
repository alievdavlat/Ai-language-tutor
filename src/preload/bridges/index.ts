import { grammarBridge, type GrammarBridge } from './grammar.bridge.js'
import { hardwareBridge, type HardwareBridge } from './hardware.bridge.js'
import { ollamaBridge, type OllamaBridge } from './ollama.bridge.js'
import { placementBridge, type PlacementBridge } from './placement.bridge.js'
import { productivityBridge, type ProductivityBridge } from './productivity.bridge.js'
import { profileBridge, type ProfileBridge } from './profile.bridge.js'
import { sidecarsBridge, type SidecarsBridge } from './sidecars.bridge.js'
import { sttBridge, type SttBridge } from './stt.bridge.js'
import { updateBridge, type UpdateBridge } from './update.bridge.js'

export interface AppApi {
  hardware: HardwareBridge
  ollama: OllamaBridge
  profile: ProfileBridge
  placement: PlacementBridge
  grammar: GrammarBridge
  stt: SttBridge
  sidecars: SidecarsBridge
  productivity: ProductivityBridge
  update: UpdateBridge
}

export const api: AppApi = {
  hardware: hardwareBridge,
  ollama: ollamaBridge,
  profile: profileBridge,
  placement: placementBridge,
  grammar: grammarBridge,
  stt: sttBridge,
  sidecars: sidecarsBridge,
  productivity: productivityBridge,
  update: updateBridge
}
