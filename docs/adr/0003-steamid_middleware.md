# SteamID por petición: middleware dedicado vs resolución repetida en cada método

> **Decisión**: Resolver el `steamId` del usuario autenticado una sola vez, en un middleware dedicado (`getSteamId`), en vez de que cada método que lo necesite lo resuelva por su cuenta.
> **Fecha**: 2026-08-13

---

## Contexto

- El SteamID se necesita para pedir la biblioteca de juegos y los logros de cada uno.
- Es un dato que consideré pedir solo una vez y tener siempre disponible en cada llamada a la API de Steam.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| Cada método resuelve su propio `steamId` cuando lo necesita | No hace falta tocar el objeto `Request` ni crear un middleware nuevo | `gameAchievements` se llama una vez por cada juego encontrado: si resolviera el steamId, repetiría la misma consulta a `AuthMethod` para el mismo usuario varias veces en la misma petición |
| ⭐ **Middleware dedicado: se resuelve una vez por petición** | Una sola consulta a `AuthMethod` por petición, sin importar cuántos métodos internos necesiten después el steamId. El controller queda más simple: lee `req.steamId` en vez de pedirlo a `UserService` | El middleware tiene que montarse en cada ruta que lo necesite |

## Razonamiento

- La finalidad era evitar repetir la misma consulta a `AuthMethod` varias veces dentro de una misma petición.
- `gameAchievements` se ejecuta una vez por cada juego encontrado: resolver el `steamId` dentro de ese método habría supuesto tantas consultas a Mongo como juegos devolviese la búsqueda, pidiendo siempre el mismo dato.

## Decisión

**Elegida: middleware dedicado `getSteamId`.**

```ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";

const userService = new UserService();


export const getSteamId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.steamId = await userService.getSteamId(req.user)
    return next();
  } catch (error) {
    next(error);
  }
}
```

Se ejecuta tras `ensureAuthenticated` en las rutas que necesitan el `steamId`:

```ts
router.get(
  `/search`,
  ensureAuthenticated,
  getSteamId,
  gamesController.searchGame.bind(gamesController),
);
```

## Cuándo revisar esta decisión

- Si aparecen más datos derivados del usuario que varios controllers necesiten resolver de forma parecida: en ese caso, investigar algún patrón de diseño o arquitectura en vez de crear un middleware nuevo por cada dato.
- Si el número de rutas protegidas crece demasiado: tocaría plantear agrupar middlewares por defecto.
