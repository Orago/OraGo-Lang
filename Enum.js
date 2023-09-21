/**
 * Create an index-based object from an array, mapping each unique element to its index.
 * @template T
 * @param {T[]} array - The input array.
 * @returns {Object.<T, number>} - The indexed object.
 */
function indexArray(array) {
  return Object.fromEntries(
    [...new Set(array)].map((value, index) => [value, index])
  );
}

/**
 * Create a symbol-based object from an array, mapping each unique element to a symbol.
 * @param {any[]} array - The input array.
 * @returns {Object.<any, symbol>} - The symbol-based object.
 */
function symbolArray(array) {
  return Object.fromEntries(
    [...new Set(array)].map((value) => [value, Symbol(value)])
  );
}

/**
 * Base class for Extendable Enums.
 * @class
 */
class ExtendableEnum {
  /**
   * Create an instance of ExtendableEnum.
   * @param {(array: any[]) => Object} parse - The parsing function to use.
   * @param {any[]} values - The values to parse.
   */
  constructor(parse, values) {
    /**
     * The values of the ExtendableEnum.
     * @type {Object.<any, number>}
     */
    this.values = parse(values);
  }

  /**
   * Get the valueOf representation of the ExtendableEnum.
   * @returns {Object.<any, number>} - The valueOf representation.
   */
  valueOf() {
    return Object.freeze(Object.assign({}, this.values));
  }

  /**
   * Check if an item exists in the ExtendableEnum.
   * @param {any} item - The item to check.
   * @returns {boolean} - True if the item exists, false otherwise.
   */
  has(item) {
    return this.values.hasOwnProperty(item);
  }
}

/**
 * An Extendable Enum class.
 * @class
 * @extends {ExtendableEnum}
 */
export class Enum extends ExtendableEnum {
  /**
   * Create an instance of Enum.
   * @param {...any} values - The values of the Enum.
   */
  constructor(...values) {
    super(indexArray, values);
  }
}

/**
 * An Extendable Enum class with different parsing.
 * @class
 * @extends {ExtendableEnum}
 */
export class Unique extends ExtendableEnum {
  /**
   * Create an instance of Unique.
   * @param {...any} values - The values of the Unique Enum.
   */
  constructor(...values) {
    super(symbolArray, values);
  }
}
