const { flatLang, splitCommas, convertToType, isVariable, parseVariable } = require('../flatlang/index.js');


flatLang()`
timer,start

cache,next
math,5 * 3 - 1
cache,set,addedValues

 

print('hello')
timer,end
`