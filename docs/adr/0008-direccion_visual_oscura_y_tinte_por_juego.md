# Dirección visual: oscuro, con el tinte del juego en toda la navegación

> **Decisión**: Adoptar un estilo oscuro, con las portadas como elemento principal y un fondo teñido por los colores de la portada del juego actual en todas las pantallas posteriores al login.  
> **Fecha**: 2026-11-18

---

## Contexto

Quería una nueva dirección visual para el rediseño de toda la aplicación. Más tarde, la biblioteca y el perfil quedaron con aspecto distinto al del dashboard y la página del juego, y tuve que decidir cuál era la referencia.

## Opciones para la dirección visual

### Oscuro de "temática gamer"

Fondos casi negros, portadas verticales grandes y acentos tomados del arte del juego.

**Ventajas:**

- Es el lenguaje de Steam y de otras plataformas gaming.
- Las portadas ya llegan en formato vertical desde el CDN (ADR 0005).

### Editorial y limpio

Mucho aire y tipografía con carácter.

**Desventajas:**

- El color se concentra menos en las portadas.

### Vitrina de coleccionista

Insignias y medallas por juego.

**Ventajas:**

- Encaja con los logros.

**Desventajas:**

- Pide más diseño propio por juego.

### Cristal suave con gradientes

**Ventajas:**

- Es moderno.

**Desventajas:**

- Es genérico para esta temática.

## Opciones para la referencia de todas las pantallas

### Fondo fijo

Un único color de fondo para toda la aplicación.

**Ventajas:**

- Es simple.

**Desventajas:**

- Pierde lo más distintivo del dashboard.

### Fondo teñido por el juego actual

La paleta sale de los colores de la portada del último juego buscado.

**Ventajas:**

- Es más inmersivo y crea una atmósfera más elegante

## Razonamiento

Elijo **oscuro** porque las portadas verticales son lo más reconocible para el usuario y ya las tengo. Para la referencia elijo el **fondo teñido por el juego actual**: el tinte por juego es lo que más diferencia la aplicación.

## Decisión

**Elijo oscuro, con el fondo teñido por el juego actual.**

- Paleta base en azul-negro con texto blanco cálido, tipografías Barlow Condensed para títulos e Instrument Sans para texto.
- El componente `TintedPage` da a cada pantalla el fondo con degradado y las variables `--p-line`, `--p-surface` y `--p-accent`. Lo usan el dashboard, la biblioteca, la página del juego y el perfil.
- La vista de login conserva su propio fondo.

## Consecuencias

- Todas las pantallas usan el mismo componente, así que el aspecto se cambia en un solo sitio.
- Los tokens de color del tema global (`ink` y `ink-text`, en naranja) solo los usa ya la vista de login. Queda por decidir si se limpian.