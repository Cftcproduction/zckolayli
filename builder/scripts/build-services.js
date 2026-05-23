const fs = require("fs");
const path = require("path");

/**
 * SEO Static Builder
 * JSON'daki uzmanlık sayfalarını statik HTML üretir.
 * Ayrıca contact.html, about.html gibi statik sayfaları temiz URL yapısına taşır.
 *
 * Çalıştır:
 * npm run build
 */

// =======================
// AYARLAR
// =======================

const SITE_URL = "https://www.zckolayli.av.tr";
const BRAND_TITLE = "ZCKolaylı Hukuk Bürosu";
// build-services.js => builder/scripts içinde olduğu için

// Ana proje kökü: zckolayli/
const BUILDER_ROOT = path.resolve(__dirname, "..");
const PROJECT_ROOT = path.resolve(BUILDER_ROOT, "..");

const SRC_DIR = path.join(PROJECT_ROOT, "src");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");

const DATA_PATH = path.join(BUILDER_ROOT, "data", "services.json");
const TEMPLATE_PATH = path.join(BUILDER_ROOT, "services-template", "services-template.html");

const SERVICES_BASE = "uzmanliklar";

// Statik sayfa yönlendirme tablosu
const staticPages = [
  {
    input: path.join(SRC_DIR, "index.html"),
    output: "",
    title: `${BRAND_TITLE} | Ana Sayfa`,
    description: "ZCKolaylı Hukuk Bürosu, hukuki süreçlerde profesyonel danışmanlık ve dava takibi hizmetleri sunar.",
  },
  {
    input: path.join(SRC_DIR, "about.html"),
    output: "hakkimizda",
    title: `${BRAND_TITLE} | Hakkımızda`,
    description: "ZCKolaylı Hukuk Bürosu hakkında bilgi alın.",
  },
  {
    input: path.join(SRC_DIR, "contact.html"),
    output: "iletisim",
    title: `${BRAND_TITLE} | İletişim`,
    description: "ZCKolaylı Hukuk Bürosu ile iletişime geçin.",
  },
  {
    input: path.join(SRC_DIR, "blog.html"),
    output: "blog",
    title: `${BRAND_TITLE} | Blog`,
    description: "Hukuki bilgilendirme yazıları ve güncel içerikler.",
  },
  {
    input: path.join(SRC_DIR, "blog-detail.html"),
    output: "blog/isten-cikarilan-calisanin-haklari-nelerdir",
    title: `${BRAND_TITLE} | İşten Çıkarılan Çalışanın Hakları Nelerdir?`,
    description: "İşten çıkarılan çalışanların kıdem tazminatı, ihbar tazminatı ve dava hakları hakkında hukuki bilgilendirme.",
  },
  {
    input: path.join(SRC_DIR, "payment.html"),
    output: "odeme",
    title: `${BRAND_TITLE} | Online Ödeme`,
    description: "ZCKolaylı Hukuk Bürosu online ödeme sayfası.",
  },
];

// =======================
// YARDIMCI FONKSİYONLAR
// =======================

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  ensureDir(dir);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach((entry) => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeDescription(page) {
  const raw = page.seo?.description || page.servicesDetail?.paragraphHtml || page.servicesDetail?.heading || page.pageTitle?.h1 || "";

  const text = stripHtml(raw);

  if (text.length <= 155) return text;

  return text.slice(0, 152).replace(/\s+\S*$/, "") + "...";
}

function normalizeUrlPath(value = "") {
  return String(value).replace(/^\/+|\/+$/g, "");
}

function getOutputPath(outputSlug) {
  if (!outputSlug) return path.join(DIST_DIR, "index.html");

  const dir = path.join(DIST_DIR, normalizeUrlPath(outputSlug));

  ensureDir(dir);

  return path.join(dir, "index.html");
}

function getCanonical(outputSlug) {
  const clean = normalizeUrlPath(outputSlug);

  if (!clean) return `${SITE_URL}/`;

  return `${SITE_URL}/${clean}/`;
}

function replaceOrInjectHeadTag(html, regex, tag) {
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return html.replace("</head>", `  ${tag}\n</head>`);
}

function updateHeadMeta(html, options) {
  const { lang = "tr", title, description, canonical, ogImage } = options;

  html = html.replace(/<html[^>]*>/i, `<html lang="${lang}">`);

  html = replaceOrInjectHeadTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  html = replaceOrInjectHeadTag(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);

  html = replaceOrInjectHeadTag(html, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}" />`);

  html = replaceOrInjectHeadTag(html, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);

  html = replaceOrInjectHeadTag(html, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);

  html = replaceOrInjectHeadTag(html, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}" />`);

  html = replaceOrInjectHeadTag(html, /<meta\s+property=["']og:type["'][^>]*>/i, `<meta property="og:type" content="website" />`);

  if (ogImage) {
    html = replaceOrInjectHeadTag(html, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
  }

  return html;
}
function fixAssetPaths(html) {
  return html
    .replace(/href=["']css\//g, 'href="/css/')
    .replace(/href=["']images\//g, 'href="/images/')
    .replace(/src=["']js\//g, 'src="/js/')
    .replace(/src=["']images\//g, 'src="/images/')
    .replace(/url\(["']?images\//g, 'url("/images/');
}
function fixInternalLinks(html) {
  const linkMap = {
    "index.html": "/",
    "about.html": "/hakkimizda/",
    "contact.html": "/iletisim/",
    "blog.html": "/blog/",
    "blog-detail.html": "/blog/isten-cikarilan-calisanin-haklari-nelerdir/",
    "payment.html": "/odeme/",
    "services-template.html?page=": `/uzmanliklar/`,
  };

  html = html.replace(/href=["']index\.html["']/g, `href="/"`);
  html = html.replace(/href=["']about\.html["']/g, `href="/hakkimizda/"`);
  html = html.replace(/href=["']contact\.html["']/g, `href="/iletisim/"`);
  html = html.replace(/href=["']blog\.html["']/g, `href="/blog/"`);
  html = html.replace(/href=["']blog-detail\.html["']/g, `href="/blog/isten-cikarilan-calisanin-haklari-nelerdir/"`);
  html = html.replace(/href=["']payment\.html["']/g, `href="/odeme/"`);

  html = html.replace(/href=["']services-template\.html\?page=([^"']+)["']/g, function (_, slug) {
    return `href="/${SERVICES_BASE}/${slug}/"`;
  });

  return html;
}

function removeServicesLoader(html) {
  return html.replace(/\s*<script\s+src=["']js\/services-loader\.js["']>\s*<\/script>/i, "");
}

function setBackgroundImage(html, id, imagePath) {
  if (!imagePath) return html;

  const regex = new RegExp(`(<section[^>]*id=["']${id}["'][^>]*class=["'][^"']*page-title[^"']*["'][^>]*)>`, "i");

  if (regex.test(html)) {
    return html.replace(regex, `$1 style="background-image: url('${imagePath}')">`);
  }

  return html;
}

function replaceContentById(html, id, content) {
  const regex = new RegExp(`(<[^>]+id=["']${id}["'][^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`, "i");

  return html.replace(regex, `$1${content}$3`);
}

function replaceImageById(html, id, src, alt = "") {
  const regex = new RegExp(`<img([^>]*?)id=["']${id}["']([^>]*?)>`, "i");

  return html.replace(regex, function (match, before, after) {
    let tag = `<img${before}id="${id}"${after}>`;

    if (/src=["'][^"']*["']/i.test(tag)) {
      tag = tag.replace(/src=["'][^"']*["']/i, `src="${src}"`);
    } else {
      tag = tag.replace("<img", `<img src="${src}"`);
    }

    if (/alt=["'][^"']*["']/i.test(tag)) {
      tag = tag.replace(/alt=["'][^"']*["']/i, `alt="${escapeHtml(alt)}"`);
    } else {
      tag = tag.replace("<img", `<img alt="${escapeHtml(alt)}"`);
    }

    return tag;
  });
}

function renderBreadcrumb(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "";

  const first = items[0] || "Ana Sayfa";
  const last = items[items.length - 1] || "";

  return `
<li><a href="/">${escapeHtml(first)}</a></li>
<li>${escapeHtml(last)}</li>`;
}

function renderListColumns(listColumns = []) {
  let html = "";

  for (let i = 0; i < 4; i++) {
    const items = listColumns[i] || [];

    const lis = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");

    html += `
<div class="column col-lg-3 col-md-6 col-sm-6">
  <ul class="list-style-one" id="listCol${i}">
    ${lis}
  </ul>
</div>`;
  }

  return html;
}

function replaceServicesListRow(html, listColumns) {
  const rendered = renderListColumns(listColumns);

  return replaceContentById(html, "servicesListRow", rendered);
}

function buildServicePage(templateHtml, page) {
  const h1 = page.pageTitle?.h1 || page.slug;
  const description = makeDescription(page);
  const outputSlug = `${SERVICES_BASE}/${page.slug}`;
  const canonical = getCanonical(outputSlug);

  let html = templateHtml;

  html = removeServicesLoader(html);
  html = fixInternalLinks(html);
  html = fixAssetPaths(html);
  html = html.replace(/\sjs-loading/g, "");
  html = html.replace(/<div id="pagePreloader"[\s\S]*?<\/div>\s*<\/div>/i, "");

  html = updateHeadMeta(html, {
    title: page.seo?.title || `${h1} | ${BRAND_TITLE}`,
    description,
    canonical,
    ogImage: page.servicesDetail?.heroImage?.src ? `${SITE_URL}/${page.servicesDetail.heroImage.src}` : `${SITE_URL}/images/logo-zck.svg`,
  });
  function toRootAsset(value = "") {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    if (value.startsWith("/")) return value;
    return "/" + value.replace(/^\/+/, "");
  }
  html = setBackgroundImage(html, "pageTitleSection", toRootAsset(page.pageTitle?.bgImage));

  html = replaceImageById(html, "servicesHeroImage", toRootAsset(page.servicesDetail?.heroImage?.src || ""), page.servicesDetail?.heroImage?.alt || h1);

  html = replaceContentById(html, "pageTitleH1", escapeHtml(h1));
  html = replaceContentById(html, "pageBreadcrumb", renderBreadcrumb(page.pageTitle?.breadcrumb || ["Ana Sayfa", h1]));

  html = replaceContentById(html, "servicesHeading", escapeHtml(page.servicesDetail?.heading || ""));

  html = replaceContentById(html, "servicesParagraph", page.servicesDetail?.paragraphHtml || "");

  html = replaceServicesListRow(html, page.servicesDetail?.listColumns || []);

  return html;
}

function buildStaticPage(page) {
  if (!fs.existsSync(page.input)) {
    console.warn(`Atlandı, dosya yok: ${page.input}`);
    return null;
  }

  let html = fs.readFileSync(page.input, "utf8");

  html = fixInternalLinks(html);
  html = fixAssetPaths(html);

  const canonical = getCanonical(page.output);

  html = updateHeadMeta(html, {
    title: page.title,
    description: page.description,
    canonical,
    ogImage: `${SITE_URL}/images/logo-zck.svg`,
  });

  const outPath = getOutputPath(page.output);
  fs.writeFileSync(outPath, html, "utf8");

  return {
    url: canonical,
    file: outPath,
  };
}

function createSitemap(urls) {
  const now = new Date().toISOString().split("T")[0];

  const items = urls
    .map((url) => {
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

function copyAssets() {
  const assetFolders = ["css", "js", "images", "fonts"];

  assetFolders.forEach((folder) => {
    copyDir(path.join(SRC_DIR, folder), path.join(DIST_DIR, folder));
  });

  const extraFiles = ["favicon.ico", "CNAME", "robots.txt"];

  extraFiles.forEach((file) => {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DIST_DIR, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
}

// =======================
// BUILD
// =======================

function build() {
  console.log("Build başladı...");

  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`services.json bulunamadı: ${DATA_PATH}`);
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`services-template.html bulunamadı: ${TEMPLATE_PATH}`);
  }

  cleanDir(DIST_DIR);

  copyAssets();

  const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const sitemapUrls = [];

  // Statik sayfalar
  staticPages.forEach((page) => {
    const result = buildStaticPage(page);

    if (result) {
      sitemapUrls.push(result.url);
      console.log(`Statik sayfa üretildi: ${result.url}`);
    }
  });

  // Uzmanlık sayfaları
  const pages = db.pages || [];

  pages.forEach((page) => {
    if (!page.slug) return;

    const html = buildServicePage(templateHtml, page);

    const outputSlug = `${SERVICES_BASE}/${page.slug}`;
    const outPath = getOutputPath(outputSlug);

    fs.writeFileSync(outPath, html, "utf8");

    const url = getCanonical(outputSlug);
    sitemapUrls.push(url);

    console.log(`Uzmanlık sayfası üretildi: ${url}`);
  });

  // Sitemap
  const sitemap = createSitemap(sitemapUrls);
  fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");

  console.log("");
  console.log("Build tamamlandı.");
  console.log(`Çıktı klasörü: ${DIST_DIR}`);
  console.log(`Toplam URL: ${sitemapUrls.length}`);
}

build();
