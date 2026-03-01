# AGENTS

## Reglas de UI/LAYOUT (obligatorias)

1. No modificar dimensiones globales, overflow, escalado, zoom CSS, contenedores raíz o comportamiento de viewport sin petición explícita del usuario.
2. En cambios funcionales, preservar el layout visual existente (ancho/alto/encaje en pantalla) y evitar rediseños colaterales.
3. Si un ajuste funcional exige tocar layout, aplicar el cambio mínimo y validar que la app siga viéndose completa en pantalla estándar desktop.
4. Nunca ocultar contenido por recorte horizontal/vertical en contenedores principales (`AppShell`, vistas explorador, tablas) sin aprobación explícita.
5. Si aparece una regresión visual tras un cambio funcional, priorizar rollback del layout y mantener únicamente la lógica requerida.

