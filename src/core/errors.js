export const error = (text) => console.error(`[ERROR] ${text}`);
export const warning = (text) => console.log(`[WARNING] ${text}`);

export const command = (file) => warning(`The command ${file} is missing a required "data" or "execute" property.`);
