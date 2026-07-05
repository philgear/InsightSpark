import { GoogleGenAI, Type } from '@google/genai';

console.log('GoogleGenAI:', GoogleGenAI);
console.log('Type:', Type);

try {
  const ai = new GoogleGenAI({ apiKey: 'test' });
  console.log('Instantiation succeeded!');
} catch (e) {
  console.error('Instantiation failed:', e);
}
