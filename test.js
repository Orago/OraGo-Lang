const arrayCache = [];
const size = 5000000;

console.time('array created');
for (let userID = 0; userID < size; userID++){
	arrayCache.push({
		userID,
		randomShit: Math.random()
	});
}
console.timeEnd('array created');

console.log('\n-----\n');

const objCache = {};

console.time('obj created');
for (let userID = 0; userID < size; userID++){
	objCache[userID] = {
		randomShit: Math.random()
	};
}
console.timeEnd('obj created');

{
	console.time('array find');
	const user = arrayCache.find(user => user.userID == 40521);
	console.log('Array found user!', user);
	console.timeEnd('array find');
}
console.log('\n-----\n');
{
	console.time('obj find');
	const user = objCache[40521];
	console.log('Object found user!', user);
	console.timeEnd('obj find');
}
console.log('\n-----\n');
{
	console.time('array has');
	const user = arrayCache.findIndex(user => user.userID = 40521) != -1;
	console.log('Array has user!', user);
	console.timeEnd('array has');
}
console.log('\n-----\n');
{
	console.time('obj has');
	const user = objCache.hasOwnProperty(40521);
	console.log('Object has user!', user);
	console.timeEnd('obj has');
}
console.log('\n-----\n');
console.log('Array length: ', arrayCache.length);
console.log('Array length: ', Object.keys(objCache).length);