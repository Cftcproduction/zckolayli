/**
 * services-loader.js
 * - services-template.html içindeki alanları /data/services.json üzerinden doldurur.
 * - URL: services-template.html?page=corporate-law  (slug)
 * - CSS/JS düzenini bozmamak için sadece içerik alanlarına dokunur.
 */
(function () {
  "use strict";

  // Sayfa verisi gelene kadar ekran kapalı (preloader). Veri + kritik görseller hazır olunca açılır.
  function finishLoading() {
    // Skeleton varsa kapat
    var skel = document.getElementById("servicesSkeleton");
    if (skel) skel.style.display = "none";

    // Preloader kapat + sayfayı göster
    document.body.classList.remove("js-loading");
    var pre = document.getElementById("pagePreloader");
    if (pre) pre.style.display = "none";
  }

  function waitImg(id) {
    return new Promise(function (resolve) {
      var img = document.getElementById(id);
      if (!img) return resolve();
      // src yoksa bekleme
      if (!img.getAttribute("src")) return resolve();
      if (img.complete) return resolve();
      img.addEventListener("load", function () { resolve(); }, { once: true });
      img.addEventListener("error", function () { resolve(); }, { once: true });
    });
  }


  function qs(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderBreadcrumb(breadcrumb) {
    // breadcrumb: ["Ana Sayfa", "ŞİRKETLER HUKUKU"]
    var ul = qs("pageBreadcrumb");
    if (!ul || !Array.isArray(breadcrumb) || breadcrumb.length < 2) return;

    ul.innerHTML = "";
    // first item always links to index.html (template ile uyumlu)
    var li1 = document.createElement("li");
    var a = document.createElement("a");
    a.href = "index.html";
    a.textContent = breadcrumb[0];
    li1.appendChild(a);

    var li2 = document.createElement("li");
    li2.textContent = breadcrumb[1];

    ul.appendChild(li1);
    ul.appendChild(li2);
  }

  function renderListColumns(listColumns) {
    if (!Array.isArray(listColumns)) return;
    for (var i = 0; i < 4; i++) {
      var ul = qs("listCol" + i);
      if (!ul) continue;
      ul.innerHTML = "";
      var col = listColumns[i] || [];
      for (var j = 0; j < col.length; j++) {
        var li = document.createElement("li");
        li.textContent = col[j];
        ul.appendChild(li);
      }
    }
  }

  function renderPractice(blocks) {
    var wrap = qs("practiceBlocks");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!Array.isArray(blocks)) return;

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];

      var outer = document.createElement("div");
      outer.className = "practice-block col-lg-3 col-md-6 col-sm-12";

      var inner = document.createElement("div");
      inner.className = "inner-box";

      var icon = document.createElement("div");
      icon.className = "icon " + (b.iconClass || "");

      var h5 = document.createElement("h5");
      var link = document.createElement("a");
      link.href = b.href || "#";
      link.textContent = b.title || "";
      h5.appendChild(link);

      var text = document.createElement("div");
      text.className = "text";
      text.textContent = b.text || "";

      var arrow = document.createElement("a");
      arrow.className = "arrow flaticon-right-arrow-3";
      arrow.href = b.href || "#";

      inner.appendChild(icon);
      inner.appendChild(h5);
      inner.appendChild(text);
      inner.appendChild(arrow);

      outer.appendChild(inner);
      wrap.appendChild(outer);
    }
  }

  function applyPage(page) {
    // Page Title
    var titleSection = qs("pageTitleSection");
    if (titleSection && page.pageTitle && page.pageTitle.bgImage) {
      titleSection.style.backgroundImage = "url(" + page.pageTitle.bgImage + ")";
    }
    if (qs("pageTitleH1") && page.pageTitle && page.pageTitle.h1) {
      qs("pageTitleH1").textContent = page.pageTitle.h1;
    }
    if (page.pageTitle && page.pageTitle.breadcrumb) {
      renderBreadcrumb(page.pageTitle.breadcrumb);
    }

    // Services Detail
    var sd = page.servicesDetail || {};
    if (qs("servicesHeroImage") && sd.heroImage && sd.heroImage.src) {
      qs("servicesHeroImage").src = sd.heroImage.src;
      qs("servicesHeroImage").alt = sd.heroImage.alt || "";
    }
    if (qs("servicesHeading") && sd.heading) {
      qs("servicesHeading").textContent = sd.heading;
    }
    if (qs("servicesParagraph")) {
      // paragraphHtml: br gibi html içeriyorsa güvenli kabul edip innerHTML basıyoruz.
      // Eğer sadece düz metin kullanacaksan JSON'da paragraphText alanı ekleyip textContent kullan.
      qs("servicesParagraph").innerHTML = sd.paragraphHtml || "";
    }
    renderListColumns(sd.listColumns || []);

    if (qs("servicesMainCta") && sd.ctaButton) {
      qs("servicesMainCta").href = sd.ctaButton.href || "contact.html";
      // Yazı içinde ikon var; sadece metni değiştireceksek span.txt içinde güncelleyelim.
      var span = qs("servicesMainCta").querySelector(".txt");
      if (span) {
        span.innerHTML = escapeHtml(sd.ctaButton.text || "") + ' <i class="arrow flaticon-right"></i>';
      }
    }

    if (qs("formTitle") && sd.formTitle) {
      qs("formTitle").textContent = sd.formTitle;
    }

    // Practice
    if (qs("practiceTitle") && page.practiceSection && page.practiceSection.title) {
      qs("practiceTitle").textContent = page.practiceSection.title;
    }
    renderPractice((page.practiceSection && page.practiceSection.blocks) || []);

    // CTA
    var cta = page.ctaSection || {};
    if (qs("ctaImage") && cta.image && cta.image.src) {
      qs("ctaImage").src = cta.image.src;
      qs("ctaImage").alt = cta.image.alt || "";
    }
    if (qs("ctaTitle") && cta.title) {
      qs("ctaTitle").textContent = cta.title;
    }
    if (qs("ctaButton") && cta.button) {
      qs("ctaButton").href = cta.button.href || "contact.html";
      var span2 = qs("ctaButton").querySelector(".txt");
      if (span2) {
        span2.innerHTML = escapeHtml(cta.button.text || "") + ' <i class="arrow flaticon-right"></i>';
      }
    }
    if (qs("ctaHammer") && cta.hammerImageSrc) {
      qs("ctaHammer").src = cta.hammerImageSrc;
    }

    // <title> da güncellensin (SEO / sekme başlığı)
    if (page.pageTitle && page.pageTitle.h1) {
      document.title = "Zckolayli Avukatlık Bürosu | " + page.pageTitle.h1;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get("page");

    fetch("data/services.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("JSON yüklenemedi: " + r.status);
        return r.json();
      })
      .then(function (db) {
        var targetSlug = slug || db.defaultPage;
        var page = (db.pages || []).find(function (p) { return p.slug === targetSlug; });
        if (!page) {
          console.warn("Sayfa bulunamadı, defaultPage kullanılacak:", targetSlug);
          page = (db.pages || [])[0];
        }
        if (page) {
          applyPage(page);
          Promise.all([waitImg('servicesHeroImage'), waitImg('ctaImage')]).then(function(){
            finishLoading();
          });
        } else {
          finishLoading();
        }
Promise.all([waitImg('servicesHeroImage'), waitImg('ctaImage')]).then(function(){
          finishLoading();
        });
      })
      .catch(function (err) {
        console.error(err);
        finishLoading();
      });
  });
})();
