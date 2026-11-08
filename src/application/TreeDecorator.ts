import type { Shape } from "../domain/Shape.js";

export interface TreeDecorator {
  readonly name: string;
  decorate(shape: Shape): string | undefined;
}
