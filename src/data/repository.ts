import type { BusinessProfile } from '../models/business'
import type { MenuDatabase } from '../models/db'

export interface Carta {
  business: BusinessProfile
  menu: MenuDatabase
}

async function load<T>(name: string, what: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { signal })
  if (!res.ok) throw new Error(`No se pudo cargar ${what} (${res.status})`)
  return (await res.json()) as T
}

/**
 * Data access. Today the "database" is themes/<slug>/business.json + menu.json, served under data/; swap this for
 * API calls (same return type, by tenant) when there is a real backend.
 */
export async function fetchCarta(signal?: AbortSignal): Promise<Carta> {
  const [business, menu] = await Promise.all([
    load<BusinessProfile>('business', 'el negocio', signal),
    load<MenuDatabase>('menu', 'la carta', signal),
  ])
  if (business.schemaVersion !== 1) throw new Error(`Versión de negocio no soportada: ${business.schemaVersion}`)
  if (menu.schemaVersion !== 2 && menu.schemaVersion !== 3) throw new Error(`Versión de carta no soportada: ${menu.schemaVersion}`)
  if (menu.tenantId !== business.tenantId) throw new Error('La carta no corresponde a este negocio')
  return { business, menu }
}
