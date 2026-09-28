/* PROPS
 ** Color:       HEX
 ** Title:       String
 ** Image:       String
 ** URL:         String
 ** Description: String
 ** Thumbnail:   String
 ** Footer       Object { String text, String icon_url }
 ** Author:      Object { String name, String icon_url, String url }
 ** Fields:      Array [ { String name, String value, Boolean inline } ]
 */

const CUSTOM_EMOJI_REGEX = /^<a?:\w+:\d+>+$/;
const UNICODE_EMOJI_REGEX = /^[\p{Extended_Pictographic}\u200d]+$/u;
const MAXIMUM = 1024;

export const build = ({ components, ...props }) => {
  const embed = { ...props, timestamp: new Date().toISOString() };
  return { embeds: [embed], components };
};

export const space = { name: "\u200B", value: "\u200B" };

export const emoji = ({ content }) => {
  const message = content.trim();
  if (!message) return false;

  return CUSTOM_EMOJI_REGEX.test(message) || UNICODE_EMOJI_REGEX.test(message);
};

export const text = ({ content }) => {
  return content.trim().length;
};

const attachment = ({ size }) => {
  return size > 0;
};

const sticker = ({ size }) => {
  return size > 0;
};

export const image = ({ attachments, stickers, embeds }) => {
  if (attachment(attachments)) return true;
  if (sticker(stickers)) return true;

  if (embeds.length > 0) return embeds.some(({ image, thumbnail, video }) => image || thumbnail || video);

  return false;
};

export const field = (value, fallback) => (value.length <= MAXIMUM ? value : fallback);

export const attachmentsField = (attachments) => {
  if (!attachments?.size) return null;
  const value = [...attachments.values()].map(({ name, url }) => `[${name}](${url})`).join("\n");
  return { name: "Attachments", value, inline: false };
};

export const attachmentsPreview = (attachments) => {
  const image = [...(attachments?.values() ?? [])].find(({ contentType }) => contentType?.startsWith("image/"));
  return image ? { url: image.url } : undefined;
};

export const kind = (message) => {
  if (image(message)) return "image";
  if (emoji(message)) return "emoji";
  return "text";
};
