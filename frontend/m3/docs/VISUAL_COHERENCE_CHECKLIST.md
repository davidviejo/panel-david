# Checklist de coherencia visual

## Navegación
- [ ] Todas las vistas usan una shell con jerarquía clara (`header`, `sidebar` opcional, `content`).
- [ ] El header mantiene altura consistente y acciones principales visibles.
- [ ] Los enlaces activos se diferencian por color/fondo en cualquier contexto.

## Botones y CTAs
- [ ] CTAs primarias usan `Button` variant `primary`.
- [ ] Acciones secundarias usan `Button` variant `secondary` o `ghost`.
- [ ] Estados `disabled/loading` tienen feedback visual consistente.

## Cards y contenedores
- [ ] Módulos de información usan `Card` y tokens (`rounded-brand-lg`, `border-border`, `shadow-card`).
- [ ] Densidad visual (padding/márgenes) se mantiene uniforme entre portal e interno.

## Headers y tipografía
- [ ] Tipografía base (Inter) aplicada en shell, títulos y textos auxiliares.
- [ ] Jerarquía tipográfica consistente (H1/H2/subtítulos/metadata).

## Espaciado
- [ ] El `content` mantiene gutters comunes por breakpoint (`px-4 sm:px-6 lg:px-8`).
- [ ] Separadores y bloques siguen escala de espacios común (`gap-4`, `gap-6`, `py-12`, etc.).

## Estados vacíos / error / carga
- [ ] Estados vacíos usan componente `EmptyState` con icono + mensaje.
- [ ] Errores mantienen patrón visual (borde + fondo contextual + copy accionable).
- [ ] Loading comparte estructura y no rompe layout.
