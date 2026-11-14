// Génère les PNG source attendus par @capacitor/assets à partir de assets/logo.svg,
// puis : npx capacitor-assets generate --android
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync(new URL("../assets/logo.svg", import.meta.url));
const out = (name) => new URL(`../assets/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const BG = "#1D5A93";

// Icône pleine (ancien style) et foreground/background (icône adaptative)
await sharp(svg).resize(1024, 1024).png().toFile(out("icon-only.png"));
const fg = Buffer.from(readFileSync(new URL("../assets/logo.svg", import.meta.url), "utf8").replace(/<rect width="1024" height="1024"[^>]*\/>/, ""));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp(fg).resize(680, 680).png().toBuffer(), gravity: "centre" }])
  .png().toFile(out("icon-foreground.png"));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } }).png().toFile(out("icon-background.png"));

// Splash : logo centré sur fond bleu
const splash = async (name) =>
  sharp({ create: { width: 2732, height: 2732, channels: 4, background: BG } })
    .composite([{ input: await sharp(fg).resize(900, 900).png().toBuffer(), gravity: "centre" }])
    .png().toFile(out(name));
await splash("splash.png");
await splash("splash-dark.png");
// Icônes de la version web (PWA)
import { mkdirSync } from "node:fs";
const pub = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(new URL("../public/icons/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), { recursive: true });
await sharp(svg).resize(192, 192).png().toFile(pub("icon-192.png"));
await sharp(svg).resize(512, 512).png().toFile(pub("icon-512.png"));
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: await sharp(fg).resize(340, 340).png().toBuffer(), gravity: "centre" }])
  .png().toFile(pub("icon-maskable-512.png"));
await sharp(svg).resize(180, 180).png().toFile(pub("apple-touch-icon.png"));
writeFileSync(out(".generated"), "PNG générés par scripts/make-assets.mjs — ne pas éditer à la main\n");
console.log("assets/ : icon-only, icon-foreground, icon-background, splash, splash-dark");
