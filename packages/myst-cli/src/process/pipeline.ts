import type { GenericParent } from 'myst-common';

export type TransformFunction = (mdast: GenericParent) => void;

export type TransformOptions = {
  after?: string;
  before?: string;
  skip?: boolean;
};

type TransformObject = {
  name: string;
  transform?: TransformFunction;
} & TransformOptions;

/**
 * A sequential pipeline for transforming MyST AST
 */
export class TransformPipeline {
  transforms: TransformFunction[];
  constructor(transforms: TransformFunction[]) {
    this.transforms = transforms;
  }

  async run(mdast: GenericParent) {
    for (const transform of this.transforms) {
      await Promise.resolve(transform(mdast));
    }
  }
}

/**
 * Builder for assembling an asynchronous sequential pipeline for
 * processing MyST AST
 */
export class TransformPipelineBuilder {
  transforms: TransformObject[];
  constructor() {
    this.transforms = [];
  }

  build() {
    const namedTransforms = new Map(
      this.transforms.map((transform) => [transform.name, transform]),
    );

    // Check the following invariants:
    // 1. Transform has _at most_ one of `before` or `after`, but not both
    // 2. Transform does not refer to itself
    // 3. Transform refers to another transform that exists
    this.transforms.forEach((transform) => {
      // Prohibit transforms from defining multiple relationship constraints
      // This assumption avoids a class of insertion conflicts
      if (transform.before && transform.after) {
        throw new Error('Transform cannot both define before and after');
      }
      const comparison = transform.before ?? transform.after;
      if (!comparison) return;
      if (comparison === transform.name) {
        throw new Error('Transform cannot refer to itself in before or after');
      }

      if (!namedTransforms.has(comparison)) {
        throw new Error('Transform must refer to valid transform in before or after');
      }
    });

    // Perform `after` and `before` handling
    // Cyclic references will not be handled specially
    const transformOrder = this.transforms
      .filter((t) => !t.before && !t.after)
      .map(({ name }) => name);
    while (transformOrder.length !== namedTransforms.size) {
      this.transforms.forEach((t) => {
        // Have we handled this yet?
        if (transformOrder.includes(t.name)) return;
        // Otherwise, can we handle it?
        if (t.before && transformOrder.includes(t.before)) {
          transformOrder.splice(transformOrder.indexOf(t.before), 0, t.name);
        } else if (t.after && transformOrder.includes(t.after)) {
          transformOrder.splice(transformOrder.indexOf(t.after) + 1, 0, t.name);
        }
      });
    }
    // Pull out transform functions for non-skipped transforms
    const transforms = transformOrder
      .map((name) => namedTransforms.get(name)!)
      .filter(({ skip, transform }) => !skip && !!transform)
      .map(({ transform }) => transform) as TransformFunction[];
    return new TransformPipeline(transforms);
  }

  /**
   * Add AST transform function with `name`.
   * @param options - options to control the insertion point
   */
  addTransform(name: string, transform?: TransformFunction, options?: TransformOptions) {
    if (this.transforms.map((t) => t.name).includes(name)) {
      throw new Error(`Duplicate transforms with name "${name}"`);
    }
    this.transforms.push({
      name,
      transform,
      ...options,
    });
  }
}
