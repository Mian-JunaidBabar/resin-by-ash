/**
 * Studio photography supplied by Ash for launch.
 *
 * Files live in public/images/studio and are four-by-five crops of the original
 * photographs. Alt text is generated from the product name in the seed, and the
 * admin can replace every image later without touching this file.
 */

export const STUDIO_PHOTOS = {
  hero: "/images/studio/hero.webp",
  flower: "/images/studio/flower.webp",
  about: "/images/studio/about-studio.webp",
  custom: "/images/studio/custom-collage.webp",
  process: [
    "/images/studio/process-pour.webp",
    "/images/studio/process-cure.webp",
    "/images/studio/process-polish.webp",
  ],
} as const;

export const CATEGORY_PHOTOS: Record<string, string> = {
  nikkah: "/images/studio/cat-nikkah.webp",
  jewellery: "/images/studio/cat-jewellery.webp",
  "flower-preservation": "/images/studio/cat-flower.webp",
  keychains: "/images/studio/cat-keychains.webp",
  "watches-clocks": "/images/studio/cat-watches.webp",
  gifts: "/images/studio/cat-gifts.webp",
};

export const SOCIAL_PHOTOS = [
  "/images/studio/hero.webp",
  "/images/studio/keychain-all.webp",
  "/images/studio/flower.webp",
  "/images/studio/pink-tray.webp",
  "/images/studio/clock.webp",
  "/images/studio/cat-gifts.webp",
] as const;

/** Cover first, hover second. Empty arrays keep the illustrated placeholder. */
export const PRODUCT_PHOTOS: Record<string, string[]> = {
  "gold-leaf-nikkah-tray-pen-set": ["/images/studio/nikkah-tray-set.webp", "/images/studio/nikkah-pens-alt.webp"],
  "nikkah-pen-pair": ["/images/studio/nikkah-pens.webp", "/images/studio/nikkah-pens-alt.webp"],
  "nikkah-thumbprint-plaque": ["/images/studio/nikkah-plaque.webp", "/images/studio/nikkah-tray-set.webp"],
  "round-floral-nikkah-tray": ["/images/studio/floral-tray.webp", "/images/studio/floral-tray-alt.webp"],

  "pressed-rose-earrings": ["/images/studio/floral-earrings.webp", "/images/studio/floral-earrings-alt.webp"],
  "babys-breath-bangle": ["/images/studio/purple-bracelet.webp", "/images/studio/floral-bracelet.webp"],
  "pearl-drop-pendant": ["/images/studio/floral-pendant.webp", "/images/studio/moon-pendant.webp"],
  "gold-flake-hoops": ["/images/studio/daisy-hoops.webp", "/images/studio/daisy-hoops-alt.webp"],
  "forget-me-not-bangle": ["/images/studio/floral-bangle.webp", "/images/studio/floral-tray-alt.webp"],
  "initial-heart-pendant": ["/images/studio/heart-pendant.webp", "/images/studio/heart-earrings.webp"],
  "lavender-studs": ["/images/studio/purple-hearts.webp", "/images/studio/bow-earrings.webp"],
  "ocean-swirl-bangle": ["/images/studio/pearl-bracelet.webp", "/images/studio/floral-bracelet.webp"],
  "daisy-ring": ["/images/studio/teardrop-earrings.webp", "/images/studio/floral-earrings-alt.webp"],

  "mini-bouquet-block": ["/images/studio/flower-tray-close.webp", "/images/studio/floral-tray.webp"],
  "bridal-bouquet-block": ["/images/studio/floral-tray-alt.webp", "/images/studio/flower-tray-close.webp"],
  "varmala-preservation-frame": ["/images/studio/quran-stand.webp", "/images/studio/quran-box.webp"],
  "single-rose-dome": ["/images/studio/floral-pendant.webp", "/images/studio/flower-tray-close.webp"],

  "initial-keychain": ["/images/studio/keychain-a.webp", "/images/studio/keychain-all.webp"],
  "name-keychain": ["/images/studio/keychain-bc.webp", "/images/studio/keychain-fg.webp"],
  "pressed-flower-keychain": ["/images/studio/keychain-j.webp", "/images/studio/keychain-all.webp"],
  "pet-paw-keychain": ["/images/studio/keychain-d.webp", "/images/studio/keychain-bc.webp"],

  "ocean-wrist-watch": ["/images/studio/clock-glitter.webp", "/images/studio/clock-close.webp"],
  "petal-wall-clock": ["/images/studio/clock.webp", "/images/studio/clock-close.webp"],
  "ayat-wall-frame": ["/images/studio/quran-box.webp", "/images/studio/quran-stand.webp"],
  "name-wall-clock": ["/images/studio/clock-close.webp", "/images/studio/clock.webp"],

  "marble-coaster-set": ["/images/studio/purple-tray.webp", "/images/studio/pink-tray.webp"],
  "trinket-tray": ["/images/studio/pink-tray.webp", "/images/studio/purple-tray.webp"],
  "bookmark-keychain-set": ["/images/studio/bookmark.webp", "/images/studio/quran-box.webp"],
};
