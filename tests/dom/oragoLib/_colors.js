// Define a mapping of word colors to their corresponding RGB values
const wordColorMap = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  // Add more colors as needed
};

function isWordColor (input){
  return wordColorMap.hasOwnProperty(input);
}

function convertWordColorToRGB (input) {
  // Convert the word color to lowercase for case-insensitive matching
  const wordColor = (input + '').toLowerCase();

  // Check if the word color exists in the color map
  if (wordColorMap.hasOwnProperty(wordColor))
    return wordColorMap[wordColor];
  
  return null; // Return null for unrecognized word colors
}

function isHexadecimal(input) {
  // Regular expression to match hexadecimal color patterns: # followed by 3 or 6 hexadecimal digits
  const hexPattern = /^#([0-9a-fA-F]{3}){1,2}$/;

  // Check if the input matches the hexadecimal pattern
  return hexPattern.test(input);
}

function convertHexToRGB(hexColor) {
  // Remove the "#" symbol if present
  const hex = hexColor.replace('#', '');

  // Split the hexadecimal color code into red, green, and blue components
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  // Return the RGB values as an array
  return [red, green, blue];
}

function isRGB(input) {
  // Regular expression to match RGB color patterns: rgb(x, y, z) where x, y, and z are integers between 0 and 255
  const rgbPattern = /^rgb\(\s*((1?[0-9]{1,2}|2([0-4][0-9]|5[0-5])),\s*){2}(1?[0-9]{1,2}|2([0-4][0-9]|5[0-5]))\s*\)$/;

  // Check if the input matches the RGB pattern
  return rgbPattern.test(input);
}

function getRGBValues(input) {
  // Check if the input matches the RGB pattern
  if (isRGB(input))
    // Extract the RGB values from the input, then return the RGB values as an array
    return input.match(/\d+/g).map(Number);

  // Return [0, 0, 0] for non-RGB colors
  return [0, 0, 0];
}

function tryRgb (...inputs){
  // If array of 3
  if (inputs.length == 3)
    return inputs.map($ => typeof $ == 'number' ? $ : 0);

  // If Hexadecimal
  if (isHexadecimal(inputs[0]))
    return convertHexToRGB(inputs[0]);

  // If World Color
  else if (isWordColor(inputs[0]))
    return convertWordColorToRGB(inputs[0]);

  // If RGB String
  else if (isRGB(inputs[0]))
    return getRGBValues(inputs[0]);
}

function forceRgb (...inputs){
  const test = tryRgb(...inputs);

  return test ?? [0, 0, 0];
}

const cache = {};

function tryRGB_Cached (...inputs){
  const stringified = JSON.stringify(inputs);

  if (cache.hasOwnProperty(stringified))
    return cache[stringified];

  return cache[stringified] = tryRgb(...inputs);
}

export {
  isWordColor,
  convertWordColorToRGB,

  isHexadecimal,
  convertHexToRGB,
  
  isRGB,
  getRGBValues,

  tryRgb,
  forceRgb,
  tryRGB_Cached
};