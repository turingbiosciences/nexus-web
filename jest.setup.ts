import "@testing-library/jest-dom";

// Polyfill crypto.randomUUID for Jest environment (Node.js <15)
if (!global.crypto) {
  // @ts-expect-error - Polyfill crypto for Jest
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  // @ts-expect-error - Polyfill randomUUID for Jest
  global.crypto.randomUUID = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
