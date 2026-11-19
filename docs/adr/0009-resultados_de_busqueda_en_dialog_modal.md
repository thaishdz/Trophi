# Resultados de búsqueda: modal nativo con fichas frente a pestañas y panel desplegable

> **Decisión**: Mostrar los resultados de la búsqueda en un `<dialog>` modal nativo, con cada juego como una ficha de ancho completo, y dejar la biblioteca como la lista de juegos guardados, sin pestañas.
> **Fecha**: 2026-11-18

---

## Contexto

- La biblioteca tenía pestañas de estado (en progreso, completados, sin empezar) que no filtraban nada.
- Los resultados de buscar se mostraban en la misma página: al buscar, el usuario salía de sus juegos guardados.
- Tenía que decidir cómo presentar los resultados y qué hacer con las pestañas.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Pestañas Resultados y Guardados | Es lo más simple y ya existía | Buscar saca al usuario de sus guardados, y las pestañas de estado eran marcadores sin función |
| Panel desplegable junto al buscador | Es rápido de usar y no tapa la página | Con portadas o fichas, el espacio es estrecho |
| Modal con rejilla de portadas (`<dialog>` nativo) | El navegador se encarga del foco, de Escape y de dejar inerte la página | Es poco útil para comparar datos, porque la portada no lleva el progreso detallado |
| ⭐ **Modal con una ficha por juego** (`<dialog>` nativo, una ficha de ancho completo por juego) | Mismas ventajas nativas que el modal con rejilla. La ficha muestra portada, progreso y logros pendientes, que es lo que el usuario mira para decidir si guardar un juego | Un componente más |

## Razonamiento

- Los resultados son algo pasajero: se miran, se guarda alguno y se cierran. Un modal los separa de la lista de guardados.
- Entre los dos modales, el **modal con una ficha por juego** enseña más datos por el mismo espacio y encaja con lo que el usuario mira al buscar.

## Decisión

**Elijo el modal con una ficha por juego.**

| Pieza | Detalle |
|---|---|
| Biblioteca | Queda con el buscador y la lista de juegos guardados. Quito las pestañas de estado y también el buscador del dashboard |
| Cierre | Con Escape, con su botón o pulsando fuera (`closedby="any"`, con un respaldo para Safari, que no lo admite) |
| Guardar | Si guardo un juego desde el modal, la lista de detrás se actualiza sola |

## Consecuencias

- Mientras el modal está abierto, el buscador de detrás queda inerte: para buscar otra cosa hay que cerrarlo.
- Los resultados no tienen URL, así que el botón atrás no los recupera.
- Como el buscador solo está en la biblioteca, un atajo global de búsqueda queda como posible mejora.
