const enforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();

const forceTypeModule = {
  objFrom,
  forceNull:    $ => null,
  forceBoolean: $ => enforcer(Boolean, $),
  forceNumber:  ($) => enforcer(Number, isNaN($) ? false : Number($)),
  forceBigInt:  $ => enforcer(BigInt, $),
  forceString:  $ => enforcer(String, $),
  forceObject:  $ => enforcer(Object, $),
  forceArray: $ => Array.isArray($) ? $ : [],
  tryObject ($) {
    if (typeof $ == 'string'){
      try {
        return JSON.parse($);
      }
      
      catch (E) {}
    }

    else return this.forceObject($);
  }
}

const resolveTyped = (input, type) => {
  switch (type){
    case null:
    case 'null':    return forceTypeModule.forceNull(input);

    case Boolean:
    case 'boolean': return forceTypeModule.forceBoolean(input);

    case Number:
    case 'number':  return forceTypeModule.forceNumber(input);

    case 'bigint':  return forceTypeModule.forceBigInt(input);

    case String:
    case 'string':  return forceTypeModule.forceString(input);

    case Object:
    case 'object':  return forceTypeModule.forceObject(input);

    case Array:
    case 'array':   return forceTypeModule.forceArray(input);
    
    default:        return input;
  }
}

function objFrom (obj, keys){
  const res = {};

  for (const key of keys)
    if (Array.isArray(key) && obj.hasOwnProperty(key[0]))
      res[key[0]] = resolveTyped(obj[key[0]], key[1]);

    else if (obj.hasOwnProperty(key))
      res[key] = obj[key];
      
  return res;
}

const {
  forceNull,
  forceBoolean,
  forceNumber,
  forceBigInt,
  forceString,
  forceObject,
  forceArray
} = forceTypeModule;

function tryObject  ($) {
    if (typeof $ == 'string'){
      try {
        return JSON.parse($);
      }
      
      catch (E) {}
    }

    return forceTypeModule.forceObject($);
  }

function tryArray ($) {
    if (typeof $ == 'string'){
      try {
        const res = JSON.parse($);

        return Array.isArray(res) ? res : [];
      }
      
      catch (E) {}
    }

    return forceTypeModule.forceArray($);
  }

export {
  forceNull,
  forceBoolean,
  forceNumber,
  forceBigInt,
  forceString,
  forceObject,
  forceArray,
  objFrom,
  tryObject,
  tryArray
}