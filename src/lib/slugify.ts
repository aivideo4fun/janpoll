export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sА-я\u0900-\u097F]/g, '') // हिंदी, अंग्रेजी और नंबर को छोड़कर स्पेशल कैरेक्टर हटाएं
    .trim()
    .replace(/\s+/g, '-'); // स्पेस की जगह हाइफन (-) लगाएं
}