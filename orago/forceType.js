const typeEnforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();

const forceType = {
  forceNull:    $ => null,
  forceBoolean: $ => typeEnforcer(Boolean, $),
  forceNumber:  $ => typeEnforcer(Number, isNaN($) ? false : Number($)),
  forceBigInt:  $ => typeEnforcer(BigInt, $),
  forceString:  $ => typeEnforcer(String, $),
  forceObject:  $ => typeEnforcer(Object, $),
  forceArray: $ => Array.isArray($) ? $ : []
}
module.exports = forceType;