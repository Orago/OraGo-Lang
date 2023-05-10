const typeEnforcer = (type, value) => typeof new type().valueOf() === typeof value && value !== null ? value : new type().valueOf();

const forceType = {
	forceNull:    $ => null,
	forceBoolean: $ => typeEnforcer(Boolean, $),
	forceNumber:  $ => typeEnforcer(Number, isNaN($) ? false : Number($)),
	forceBigInt:  $ => typeEnforcer(BigInt, $),
	forceString:  $ => typeEnforcer(String, $),
	forceObject:  $ => typeEnforcer(Object, $),
	forceArray:   $ => Array.isArray($) ? $ : []
}

const resolveTyped = (input, type = 'any') => {
  switch (type){
    case null:
    case 'null':    return forceType.forceNull(input);

    case Boolean:
    case 'boolean': return forceType.forceBoolean(input);

    case Number:
    case 'number':  return forceType.forceNumber(input);

    case 'bigint':  return forceType.forceBigInt(input);

    case String:
    case 'string':  return forceType.forceString(input);

    case Object:
    case 'object':  return forceType.forceObject(input);

    case Array:
    case 'array':   return forceType.forceArray(input);
		
    case 'any':
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

const Enum = (...args) => Object.freeze(args.reduce((v, arg, i) => (v[arg] = i, v), {}));

const isNum = (num) => !isNaN(num);

const isA0  = (x) => x != undefined && /[a-z0-9]/i.test(x);
const isA_0 = (x) => x != undefined && /[a-z0-9_]/i.test(x);
const isString = input => strReg.test(input);

const strReg = /(['"])(.*?)\1/;
const isMath = input => /^(~\w+|[\d\s+\-*/()]+)+$/.test(input);

export {
	forceType,
	resolveTyped,
	objFrom,
	Enum,
	isNum,
	isA0,
	isA_0,
	isString,
	isMath
}