export class CommandParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandParseError";
  }
}

export class CommandParser {
  parse(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quote: '"' | undefined;
    let escaped = false;
    let tokenStarted = false;

    for (const character of input) {
      if (escaped) {
        current += character;
        escaped = false;
        continue;
      }
      if (quote !== undefined) {
        if (character === "\\") {
          escaped = true;
        } else if (character === quote) {
          quote = undefined;
        } else {
          current += character;
        }
        tokenStarted = true;
        continue;
      }
      if (character === '"') {
        quote = '"';
        tokenStarted = true;
      } else if (/\s/.test(character)) {
        if (tokenStarted) {
          tokens.push(current);
          current = "";
          tokenStarted = false;
        }
      } else {
        current += character;
        tokenStarted = true;
      }
    }

    if (escaped) {
      current += "\\";
    }
    if (quote !== undefined) {
      throw new CommandParseError("unterminated quoted argument");
    }
    if (tokenStarted) {
      tokens.push(current);
    }
    return tokens;
  }
}
