/**
 * The business itself (themes/<slug>/business.json): identity, legal data, contact, branches and hours.
 * Separate from the menu (db.ts) and the look (theme.json); the three share one `tenantId`.
 * Everything optional is `null` when unknown, so a demo can carry the basics and a client everything.
 */

/** Immutable id of the business (a UUID). Unlike the slug (folder and URL), it never changes; in V4 it is `tenant_id`. */
export type TenantId = string

/** What kind of business it is: picks the Schema.org type and, later, the directory section. */
export type BusinessKind =
  | 'cafeteria'
  | 'panaderia'
  | 'restaurante'
  | 'sushi-bar'
  | 'comidas-rapidas'
  | 'pizzeria'
  | 'heladeria'
  | 'bar'
  | 'catalogo'

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'nequi' | 'daviplata' | 'transferencia' | 'bre-b'

/** How customers are served at a branch */
export type Service = 'mesa' | 'para-llevar' | 'domicilio'

export interface BusinessProfile {
  schemaVersion: 1
  tenantId: TenantId
  /** trade name, shown everywhere */
  name: string
  tagline: string
  kind: BusinessKind
  legal: {
    /** razón social */
    name: string | null
    /** NIT in Colombia (`dv` = dígito de verificación); EIN in the US */
    taxId: { type: 'NIT' | 'CC' | 'EIN'; number: string; dv: string | null } | null
    /** data-processing policy (Ley 1581); required before V2 collects customers' data */
    dataPolicyUrl: string | null
  }
  /** business-wide channels; a branch may override phone and WhatsApp */
  contact: {
    /** E.164, e.g. "+573132236769" */
    phone: string | null
    whatsapp: string | null
    email: string | null
    website: string | null
  }
  /** handles, without @ */
  social: {
    instagram: string | null
    facebook: string | null
    tiktok: string | null
  }
  payments: PaymentMethod[]
  locale: 'es-CO' | 'es-US' | 'en-US'
  currency: 'COP' | 'USD'
  /** IANA zone the hours are written in, unless a branch says otherwise */
  timezone: string
  /** the branch this carta shows */
  defaultBranchId: string
  branches: Branch[]
  /** V2: orders sent by WhatsApp. Absent or disabled = carta only (V1), and the build carries no ordering code */
  ordering?: Ordering | null
}

/** V2 settings: the customer builds an order and sends it by WhatsApp (no payments, no POS). */
export interface Ordering {
  enabled: boolean
  /** E.164 number that receives the orders; null = the branch's WhatsApp, then contact.whatsapp */
  whatsapp: string | null
  /** how the order can be served, in the order the customer sees them; must be services of the branch */
  modes: Service[]
  /** smallest subtotal accepted (COP); null = no minimum */
  minOrder: number | null
  /** delivery fee for "domicilio"; null = the business confirms it by WhatsApp */
  deliveryFee: number | null
}

export interface Branch {
  id: string
  name: string
  address: string
  city: string
  /** departamento / state */
  region: string | null
  /** ISO 3166-1 alpha-2 */
  country: string
  geo: { lat: number; lng: number } | null
  mapsUrl: string | null
  phone: string | null
  whatsapp: string | null
  services: Service[]
  timezone?: string
  /** one row per opening span; a day without rows is closed */
  hours: OpeningHours[]
}

export interface OpeningHours {
  /** 0 = domingo … 6 = sábado */
  day: number
  /** 24h "HH:MM"; `close` may be after midnight ("01:00") */
  open: string
  close: string
}
