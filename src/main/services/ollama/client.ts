import { Ollama } from 'ollama'

export const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'

export const ollamaClient = new Ollama({ host: OLLAMA_HOST })
