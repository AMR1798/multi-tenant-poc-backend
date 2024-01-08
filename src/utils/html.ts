import he from 'he';

function decodeHTMLString(encodedString: string): string {
  return he.decode(encodedString);
}

export { decodeHTMLString };
