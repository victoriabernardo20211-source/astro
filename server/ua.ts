export interface DeviceInfo {
  device: string; // friendly label: "Samsung · SM-A515F", "iPhone", "Computador"
  brand: string; // Samsung / Xiaomi / Apple / Motorola / Computador…
  os: string; // "Android 13", "iOS", "Windows", "macOS", "Linux"
  browser: string; // Chrome / Safari / Samsung Internet / Firefox…
}

/** Maps an Android model string to a friendly brand. */
function androidBrand(model: string): string {
  const m = model.toLowerCase();
  if (/^sm-|^gt-|galaxy|samsung/.test(m)) return "Samsung";
  if (/redmi|poco|^m\d|^mi |xiaomi|^220|^230|^231|^2201|^2210/.test(m)) return "Xiaomi";
  if (/moto|^xt\d/.test(m)) return "Motorola";
  if (/pixel/.test(m)) return "Google";
  if (/huawei|^alp-|^ele-|^vog-|^ana-|honor/.test(m)) return "Huawei";
  if (/^rmx|realme/.test(m)) return "Realme";
  if (/oneplus|^gm\d|^be\d|^kb\d/.test(m)) return "OnePlus";
  if (/^vivo|^v\d{4}/.test(m)) return "vivo";
  if (/oppo|^cph/.test(m)) return "OPPO";
  if (/^lm-|lg-|nexus 5/.test(m)) return "LG";
  if (/asus|zenfone/.test(m)) return "Asus";
  if (/infinix/.test(m)) return "Infinix";
  if (/tecno/.test(m)) return "Tecno";
  if (/nokia/.test(m)) return "Nokia";
  return "Android";
}

function detectBrowser(ua: string): string {
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/CriOS/i.test(ua)) return "Chrome";
  if (/FxiOS|Firefox/i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua)) return "Safari";
  return "Navegador";
}

/** Parses a User-Agent string into a friendly device / OS / browser. */
export function parseUa(uaRaw: string | undefined | null): DeviceInfo {
  const ua = (uaRaw || "").trim();
  const browser = detectBrowser(ua);

  if (!ua) {
    return { device: "Desconhecido", brand: "Desconhecido", os: "—", browser };
  }

  // iPhone / iPad
  if (/iPhone/i.test(ua)) {
    const v = ua.match(/OS (\d+[_\.]\d+)/i)?.[1]?.replace(/_/g, ".");
    return { device: "iPhone", brand: "Apple", os: v ? `iOS ${v}` : "iOS", browser };
  }
  if (/iPad/i.test(ua)) {
    return { device: "iPad", brand: "Apple", os: "iPadOS", browser };
  }

  // Android — try to extract the model
  if (/Android/i.test(ua)) {
    const ver = ua.match(/Android\s([\d.]+)/i)?.[1];
    const os = ver ? `Android ${ver}` : "Android";
    // model sits after "Android x;" — prefer stopping at "Build/" (keeps
    // parenthesised model names like "moto g(30)"), else at the closing paren.
    let model =
      ua.match(/Android[^;]*;\s*([^;]+?)\s+Build\//i)?.[1]?.trim() ||
      ua.match(/Android[^;]*;\s*([^;)]+)\)/i)?.[1]?.trim() ||
      "";
    // drop locale tokens like "pt-br" that sometimes precede the model
    model = model.replace(/^[a-z]{2}-[a-z]{2};?\s*/i, "").trim();
    const brand = androidBrand(model);
    const cleanModel = model && !/^wv$/i.test(model) ? model : "";
    const device =
      brand !== "Android" && cleanModel
        ? `${brand} · ${cleanModel}`
        : cleanModel || brand;
    return { device: device || "Android", brand, os, browser };
  }

  // Desktop
  if (/Windows NT/i.test(ua)) {
    return { device: "Computador (Windows)", brand: "Computador", os: "Windows", browser };
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return { device: "Computador (Mac)", brand: "Apple", os: "macOS", browser };
  }
  if (/Linux/i.test(ua)) {
    return { device: "Computador (Linux)", brand: "Computador", os: "Linux", browser };
  }

  return { device: "Desconhecido", brand: "Desconhecido", os: "—", browser };
}
