# Inversion of control in services: manual instantiation vs. a container

> **Decision**: Keep instantiating services and controllers by hand in `routes/index.ts` and do not introduce an inversion of control container for now.
> **Date**: 2026-11-18
> **Original**: [Spanish](../0010-inversion_de_control_descartada.md)

---

## Context

- `routes/index.ts` creates the services and controllers by hand and passes them through constructors.
- A pending note proposed moving to IoC or dependency injection if the services grew. I decided to evaluate it and close it.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| ⭐ **Manual instantiation in `routes/index.ts`** | Fits in a few lines and reads top to bottom in one file. It already is constructor dependency injection: the tests use it by creating the service with a mocked `SteamService` | Grows linearly with each service and controller |
| IoC container (tsyringe, InversifyJS or NestJS) | Avoids creating and wiring instances by hand and centralises the lifecycle (singleton, per request) | A new dependency, usually with decorators and `reflect-metadata`, which touches `tsconfig` and complicates a server that starts with `ts-node-dev --transpile-only`. More magic: I can no longer see in one place what is created and with which dependencies |
| A `container.ts` file with no libraries | Moves instance creation out of `routes` without adding dependencies | Does not handle lifecycle, it only relocates the code |

## Reasoning

- The problem an **IoC container** would solve does not exist yet.
- During this session I added two services and two controllers, and instance creation is still short and readable.
- I already have the injection I am after.

## Decision

**I choose manual instantiation.**

## When to revisit

- When instance creation in `routes/index.ts` no longer fits on one screen or starts repeating in other files. At that point, the **`container.ts` file** first.
- If I need a lifecycle other than singleton, for example with email login.
- If a real need appears that only a container solves.
