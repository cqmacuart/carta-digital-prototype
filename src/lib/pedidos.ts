import { useEffect, useState } from 'react'
import type * as Pedidos from '../pedidos'

export type PedidosModule = typeof Pedidos

// __PEDIDOS__ is a build-time constant: false folds this to null, and the import (with its chunk) disappears
const load = __PEDIDOS__ ? () => import('../pedidos') : null

/** The ordering module (V2) once loaded; always null for a business that only shows its carta. */
export function usePedidos() {
  const [mod, setMod] = useState<PedidosModule | null>(null)
  useEffect(() => {
    if (!load) return
    let live = true
    load().then((m) => live && setMod(m))
    return () => {
      live = false
    }
  }, [])
  return mod
}
