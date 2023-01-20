export default (obj, data) => {
  for (let key of Object.keys(data))
    obj[key] = data[key];

  return obj;
}