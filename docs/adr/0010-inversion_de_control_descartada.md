# Inversión de control en los servicios: instanciación manual frente a un contenedor

> **Decisión**: Mantener la instanciación manual de servicios y controladores en `routes/index.ts` y no introducir un contenedor de inversión de control por ahora.
> **Fecha**: 2026-11-18

---

## Contexto

- `routes/index.ts` crea a mano los servicios y los controladores, y se los pasa por constructor.
- Una observación pendiente proponía pasar a IoC o inyección de dependencias si los servicios crecían. Decidí valorarla y cerrarla.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| ⭐ **Instanciación manual en `routes/index.ts`** | Cabe en pocas líneas y se lee de arriba abajo en un solo archivo. Ya es inyección de dependencias por constructor: los tests la aprovechan creando el servicio con el `SteamService` mockeado | Crece linealmente con cada servicio y cada controlador |
| Contenedor IoC (tsyringe, InversifyJS o NestJS) | Evita crear y conectar las instancias a mano y centraliza el ciclo de vida (singleton, por petición) | Una dependencia nueva, normalmente con decoradores y `reflect-metadata`, lo que toca `tsconfig` y complica un servidor que arranca con `ts-node-dev --transpile-only`. Más magia: dejo de ver en un solo sitio qué se crea y con qué dependencias |
| Archivo `container.ts` sin librerías | Saca la creación de instancias de `routes` sin añadir dependencias | No resuelve el ciclo de vida, solo reubica el código |

## Razonamiento

- El problema que resolvería el **contenedor IoC** todavía no existe.
- Durante esta sesión añadí dos servicios y dos controladores, y la creación de instancias sigue siendo corta y legible.
- La inyección que busco ya la tengo.

## Decisión

**Elijo la instanciación manual.**

## Cuándo revisar esta decisión

- Cuando la creación de instancias en `routes/index.ts` deje de caber en una pantalla o empiece a repetirse en otros archivos. En ese momento, primero el **archivo `container.ts`**.
- Si necesito un ciclo de vida que no sea singleton, por ejemplo con el login por email.
- Si aparece una necesidad real que solo un contenedor resuelva.
