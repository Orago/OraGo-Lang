import { Token, KeywordToken } from './token.js';

export class Lexer {
  constructor (options) {
    this.keywords = options.keywords;
  }

  tokenize(code) {
    const tokens = [];
    let cursor = 0;
		let blockLevel = 0; // Track nested block scopes

    while (cursor < code.length) {
      let char = code[cursor];

			if (char === ' ') {
				cursor++;
			} else if (char === '"' || char === "'") {
				// Handle string literals
				const quoteType = char; // Store the opening quote character
				let stringValue = '';
				cursor++; // Skip the opening quote

				while (cursor < code.length && code[cursor] !== quoteType) {
					stringValue += code[cursor];
					cursor++;
				}

				if (code[cursor] === quoteType) {
					tokens.push(new Token(Token.Type.String, stringValue, blockLevel));
					cursor++; // Skip the closing quote
				} else {
					// Unterminated string
					throw new Error('Unterminated string');
				}
			}
			else if (/[a-zA-Z_]/.test(char)) {
        // Handle identifiers and keywords
        let identifier = '';
        while (cursor < code.length && /[a-zA-Z0-9_]/.test(code[cursor])) {
          identifier += code[cursor];
          cursor++;
        }

        // Check if it's a custom keyword
        for (const keyword in this.keywords)
          if (this.keywords[keyword].includes(identifier)){
            tokens.push(new KeywordToken(Token.Type.Keyword, identifier, blockLevel, keyword));
            break;
          }

        // If not a custom keyword, treat it as an identifier
        if (!tokens.find(token => token.value === identifier))
          tokens.push(new Token(Token.Type.Identifier, identifier, blockLevel));
      }
			else if (/[0-9]/.test(char)) {
        // Handle numbers
        let numberValue = '';
        while (cursor < code.length && /[0-9.]/.test(code[cursor])) {
          numberValue += code[cursor];
          cursor++;
        }

        tokens.push(new Token(Token.Type.Number, parseFloat(numberValue), blockLevel));
      }
			else if (char === '{') {
				cursor++;
        blockLevel++;
        // Handle block start
        tokens.push(new Token(Token.Type.Seperator, '{', blockLevel));
      }
			else if (char === '}') {
        // Handle block end
        if (blockLevel > 0) {
          tokens.push(new Token(Token.Type.Seperator, '}', blockLevel));
          cursor++;
          blockLevel--;
        }
				else throw new Error('Unmatched closing curly brace');
      }
			else if (['[', ']', '(', ')', ';'].some(seperator => seperator == char)){
				tokens.push(new Token(Token.Type.Seperator, char, blockLevel));
        cursor++;
			}
			else {
        // Handle other characters as operators or symbols
        tokens.push(new Token(Token.Type.Op, char, blockLevel));
        cursor++;
      }
    }

    return {
			error: false,
			tokens,
		};
  }
}