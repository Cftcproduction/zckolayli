const nameInput = document.getElementById("nameInput");
const cardNumberInput = document.getElementById("cardNumberInput");
const expInput = document.getElementById("expInput");
const cvvInput = document.getElementById("cvvInput");

const cardPreviewName = document.getElementById("cardPreviewName");
const cardPreviewNumber = document.getElementById("cardPreviewNumber");
const cardPreviewExp = document.getElementById("cardPreviewExp");

const brandBadge = document.getElementById("brandBadge");
const cardBrandText = document.getElementById("cardBrandText");

function detectBrand(digits) {
  // TROY genelde 9792 ile başlar :contentReference[oaicite:6]{index=6}
  if (/^9792/.test(digits)) return "troy";

  // UnionPay genelde 62 :contentReference[oaicite:7]{index=7}
  if (/^62/.test(digits)) return "unionpay";

  // Visa: 4 :contentReference[oaicite:8]{index=8}
  if (/^4/.test(digits)) return "visa";

  // Mastercard: 51-55 veya 2221-2720 :contentReference[oaicite:9]{index=9}
  if (/^5[1-5]/.test(digits) || /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) {
    return "mastercard";
  }

  // Amex: 34/37 (istersen)
  if (/^3[47]/.test(digits)) return "amex";

  return "unknown";
}

function formatCardNumber(digits) {
  // Şimdilik 16 hane ile sınırlı (istersen UnionPay için 19’a açarız)
  digits = digits.substring(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") || "";
}

function setBrandUI(brand) {
  // ikonları: /images/cards içine koy
  const map = {
    visa:       { label: "VISA",       icon: "images/cards/visa.svg",       cvv: 3 },
    mastercard: { label: "MASTERCARD", icon: "images/cards/mastercard.svg", cvv: 3 },
    troy:       { label: "TROY",       icon: "images/cards/troy.svg",       cvv: 3 },
    unionpay:   { label: "UNIONPAY",   icon: "images/cards/unionpay.svg",   cvv: 3 },
    amex:       { label: "AMEX",       icon: "images/cards/amex.svg",       cvv: 4 },
    unknown:    { label: "KART",       icon: "",                            cvv: 4 }
  };

  const data = map[brand] || map.unknown;

  // CVV uzunluğu
  cvvInput.maxLength = data.cvv;

  // Icon / Text bas
  if (data.icon) {
    brandBadge.innerHTML = `<img src="${data.icon}" alt="${data.label}" style="height:24px;width:auto;display:block;">`;
    cardBrandText.innerHTML = `<img src="${data.icon}" alt="${data.label}" style="height:44px;width:auto;display:block;">`;
  } else {
    brandBadge.textContent = data.label;
    cardBrandText.textContent = data.label;
  }
}

cardNumberInput.addEventListener("input", () => {
  const digits = cardNumberInput.value.replace(/\D/g, "");
  const brand = detectBrand(digits);

  cardNumberInput.value = formatCardNumber(digits);
  cardPreviewNumber.textContent = cardNumberInput.value || "0000 0000 0000 0000";

  setBrandUI(brand);
});

expInput.addEventListener("input", () => {
  let v = expInput.value.replace(/\D/g, "").substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + "/" + v.substring(2);
  expInput.value = v;
  cardPreviewExp.textContent = expInput.value || "01/23";
});

cvvInput.addEventListener("input", () => {
  const max = parseInt(cvvInput.maxLength || 4, 10);
  cvvInput.value = cvvInput.value.replace(/\D/g, "").substring(0, max);
});

nameInput.addEventListener("input", () => {
  const v = (nameInput.value || "").trim();
  cardPreviewName.textContent = v ? v.toUpperCase() : "AHMET SEZER";
});

// başlangıç
setBrandUI("unknown");
