(() => {
  const C = window.PS_CONFIG || {}, $ = id => document.getElementById(id);
  const P = new URLSearchParams(location.search), param = k => (P.get(k) || "").slice(0, 80);
  const LINK = { c: param("c"), t: param("t") };
  const postJson = (url, o) => fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(o) }).then(r => r.json());
  const mk = (tag, attrs, kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => k === "class" ? e.className = v : e.setAttribute(k, v)); (kids || []).forEach(x => e.appendChild(typeof x === "string" ? document.createTextNode(x) : x)); return e; };
  const today = () => { const d = new Date(), z = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  const sel = (el, list) => { list.forEach(x => el.appendChild(mk("option", { value: x }, [x]))); };

  sel($("media"), C.MEDIA || ["共通"]); $("from").value = today();
  if (!C.GAS_URL) $("demo").hidden = false;
  if (C.GAS_URL && !(LINK.c && LINK.t)) { $("f").hidden = true; $("intro").insertAdjacentHTML("beforeend", "<p class='err'>会社から届いたリンクから開いてください。</p>"); }
  if (LINK.c && C.GAS_URL && LINK.t) fetch(C.GAS_URL + "?action=company&c=" + encodeURIComponent(LINK.c) + "&t=" + encodeURIComponent(LINK.t)).then(r => r.json()).then(j => { if (j && j.ok) $("brand").textContent = j.name + "　料金表の入力"; }).catch(() => {});

  // 項目の一覧：prices.json（本部の標準の項目）を並べる。単価は空欄（会社が自分の金額を入れる）。標準の金額は、目安として小さく出す
  const addRow = (code, label, hint) => {
    const tr = mk("tr", { "data-code": code }, []);
    const name = mk("td", { class: "n" }, [label]); if (hint) name.appendChild(mk("div", { class: "row-detail" }, [hint]));
    const inp = mk("input", { type: "number", inputmode: "numeric", min: "0", max: "1000000", step: "1", placeholder: "円（税込）", "aria-label": label + "の料金" });
    tr.appendChild(name); tr.appendChild(mk("td", {}, [inp])); $("items").appendChild(tr); return tr;
  };
  fetch("prices.json").then(r => r.json()).then(d => {
    (d.items || []).forEach(i => addRow(i.code, i.label + "（" + i.unit + "）", "本部の標準：" + i.price.toLocaleString() + "円"));
  }).catch(() => { addRow("aircon_wall", "エアコンクリーニング 壁掛け（1台）"); addRow("aircon_auto", "エアコンクリーニング お掃除機能付き（1台）"); });
  let custom = 0;
  $("add").addEventListener("click", () => {
    custom++; const tr = mk("tr", { "data-code": "custom_" + custom, "data-custom": "1" }, []);
    const nm = mk("input", { type: "text", maxlength: "60", placeholder: "項目名（例：防カビコート）", "aria-label": "項目名" });
    const pr = mk("input", { type: "number", inputmode: "numeric", min: "0", max: "1000000", step: "1", placeholder: "円（税込）", "aria-label": "料金" });
    tr.appendChild(mk("td", { class: "n" }, [nm])); tr.appendChild(mk("td", {}, [pr])); $("items").appendChild(tr); nm.focus();
  });
  $("season").addEventListener("change", () => { $("seasonbox").hidden = !$("season").checked; });

  const err = m => { const e = $("err"); e.textContent = m; e.hidden = false; e.scrollIntoView({ block: "center", behavior: "smooth" }); return false; };
  $("f").addEventListener("submit", ev => {
    ev.preventDefault(); $("err").hidden = true;
    const season = $("season").checked, repeat = season && $("repeat").checked, from = $("from").value, to = season ? $("to").value : "";
    if (!from) return err("適用開始日を入れてください。");
    if (season && !to) return err("期間だけの料金は、適用終了日も入れてください。");
    if (to && to < from && !repeat) return err("適用終了日が、開始日より前になっています。");
    const rows = [];
    for (const tr of $("items").querySelectorAll("tr")) {
      const ins = tr.querySelectorAll("input"), price = (ins[ins.length - 1].value || "").trim();
      if (price === "") continue;
      const custom = tr.dataset.custom, label = custom ? ins[0].value.trim() : tr.firstChild.firstChild.textContent;
      if (custom && !label) return err("足した項目に、項目名を入れてください。");
      if (!/^\d+$/.test(price)) return err("金額は、0以上の整数（円・税込）で入れてください。");
      rows.push({ item: custom ? "custom:" + label : tr.dataset.code, label, price: Number(price), from, to, repeat: repeat, note: $("note").value.trim() });
    }
    if (!rows.length) return err("金額を入れた項目がありません。");
    const btn = $("submit"); btn.disabled = true; btn.textContent = "送信しています…";
    const body = { c: LINK.c, t: LINK.t, media: $("media").value, by: $("by").value.trim(), rows };
    const fin = j => { if (!j.ok) { btn.disabled = false; btn.textContent = "この内容で送信する"; return err(j.message || "送信できませんでした。"); }
      $("f").hidden = true; $("intro").hidden = true; const d = $("done"); d.hidden = false;
      d.innerHTML = "<div class='thanks'><h2>入力ありがとうございました</h2><p></p><p class='note'>続けて、別の媒体の料金を入れるときは、ページを開き直してください。</p></div>";
      d.querySelector("p").textContent = (C.GAS_URL ? "" : "（デモ表示：記録はされていません）") + j.saved + "件の料金を受け取りました。担当者の作業報告に反映されます。"; window.scrollTo(0, 0); };
    if (!C.GAS_URL) return fin({ ok: true, saved: rows.length });
    postJson(C.GAS_URL, body).then(fin).catch(() => { btn.disabled = false; btn.textContent = "この内容で送信する"; err("通信できませんでした。電波のよい所で、もう一度お試しください。"); });
  });
})();
