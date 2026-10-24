import type { MenuDatabase } from '../models/db'

/**
 * Data access. Today the "database" is a static JSON in /public/data; swap this for an API call
 * (same return type) when there is a real backend.
 */
export async function fetchMenu(businessId = 'la-sablee', signal?: AbortSignal): Promise<MenuDatabase> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${businessId}.json`, { signal })
  if (!res.ok) throw new Error(`No se pudo cargar la carta (${res.status})`)
  const db = (await res.json()) as MenuDatabase
  if (db.schemaVersion !== 1) throw new Error(`Versión de datos no soportada: ${db.schemaVersion}`)
  return db
}
