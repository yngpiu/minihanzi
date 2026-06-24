// ==UserScript==
// @name         Hanzii Premium Unlocker
// @namespace    http://tampermonkey.net/
	// @version      1.9
// @description  Tự động mở khóa tính năng premium trên Hanzii Dictionary
// @author       You
// @match        https://hanzii.net/search/*
// @icon         https://hanzii.net/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
	"use strict";

	// ── Window-level capture interceptor ───────────────────────────
	// Blocks premium card events BEFORE any Angular handler sees them.
	// Window fires before Document in capture phase, so this beats
	// any capture-phase listener Angular might register on document.

	function hgmBlockPremium(e) {
		const card = e.target.closest(".list-grammar > div");
		if (card) {
			const badge = card.querySelector(".tag-level");
			const level = badge ? badge.textContent.trim() : "";
			if (level !== "HSK1" && level !== "A1") {
				e.stopPropagation();
				e.preventDefault();
			}
			return;
		}
		// Block AI button
		if (e.target.closest(".btn-chatgpt")) {
			e.stopPropagation();
			e.preventDefault();
		}
	}

	["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"].forEach((t) => {
		window.addEventListener(t, hgmBlockPremium, true);
	});

	// Click handler — async, fetches on-demand if cache misses
	window.addEventListener("click", async (e) => {
		// ── Grammar click ──
		const card = e.target.closest(".list-grammar > div");
		if (card) {
			const badge = card.querySelector(".tag-level");
			const level = badge ? badge.textContent.trim() : "";
			if (level === "HSK1" || level === "A1") return;

			e.stopPropagation();
			e.preventDefault();

			const titleEl = card.querySelector(".box-grammar");
			if (!titleEl) return;
			const cardTitle = titleEl.textContent.replace(/【.*?】/g, "").replace(/[【】]/g, "").trim();

			// Try cache first
			let item = grammarDataCache?.find(
				(i) => grammarItemToTitle(i) === cardTitle,
			);

			// Cache miss — fetch current page on demand
			if (!item) {
				const apiPath = getApiPath();
				if (apiPath) {
					const data = await fetchWordData(apiPath);
					if (data?.result) {
						grammarDataCache = data.result;
						grammarApiPath = apiPath;
						item = grammarDataCache.find(
							(i) => grammarItemToTitle(i) === cardTitle,
						);
					}
				}
			}

			if (!item) return;
			showGrammarModal(item);
			return;
		}
	}, true);

	// ── AI button click handler ──
	window.addEventListener("click", async (e) => {
		const btn = e.target.closest(".btn-chatgpt");
		if (!btn) return;

		console.log("[Hanzii Unlocker] AI clicked, blocking...");
		e.stopPropagation();
		e.preventDefault();

		const m = location.pathname.match(/\/search\/word\/(.+)/);
		if (!m) {
			console.log("[Hanzii Unlocker] AI: not a word page");
			return;
		}
		const word = decodeURIComponent(m[1]);
		console.log("[Hanzii Unlocker] AI: fetching for", word);

		const data = await fetchAIData(word);
		if (!data?.result?.[0]?.chat_gpt?.length) {
			console.log("[Hanzii Unlocker] AI: no data");
			return;
		}
		console.log("[Hanzii Unlocker] AI: got", data.result[0].chat_gpt.length, "items");
		showAIModal(data, word);
	}, true);

	// ── Decryption (AES-CBC) ───────────────────────────────────────
	const SECRET_KEY =
		"I2F6a0dYSRcybhgOVA9aM1o+ByE4GAd+Vx4MMzQWH2cDCgFlWzYWGE5bHEBRAHNSXys7Jjl/XFFSFmQaBhUJPzU0H0tdaBABMR4MBx0eBkgNHFAfBwd7GlRFAFw6UQYlMBobBg==";
	const PASSWORD = "myPepper123";

	async function decryptData(encryptedB64) {
		const r = Uint8Array.from(atob(SECRET_KEY), (c) => c.charCodeAt(0));
		r.reverse();
		const pwd = new TextEncoder().encode(PASSWORD);
		for (let i = 0; i < r.length; i++) r[i] ^= pwd[i % pwd.length];
		const decoded = new TextDecoder().decode(r);
		const keyHash = await crypto.subtle.digest(
			"SHA-256",
			new TextEncoder().encode(decoded),
		);
		const aesKey = await crypto.subtle.importKey(
			"raw",
			keyHash,
			{ name: "AES-CBC" },
			false,
			["decrypt"],
		);
		const enc = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
		const iv = enc.slice(0, 16);
		const ct = enc.slice(16);
		const plain = await crypto.subtle.decrypt(
			{ name: "AES-CBC", iv },
			aesKey,
			ct,
		);
		return JSON.parse(new TextDecoder().decode(plain));
	}

	const apiCache = new Map();

	async function fetchWordData(path) {
		if (apiCache.has(path)) return apiCache.get(path);
		const url = `https://api2.hanzii.net${path}`;
		const resp = await fetch(url, {
			headers: { Accept: "application/json, text/plain, */*" },
		});
		if (!resp.ok) return null;
		const json = await resp.json();
		const data = json.data ? await decryptData(json.data) : null;
		if (data) apiCache.set(path, data);
		return data;
	}

	function getApiPath() {
		const m = location.pathname.match(
			/\/search\/(word|kanji|example|grammar|collocations)\/(.+)/,
		);
		if (!m) return null;
		const [, tab, raw] = m;
		const key = encodeURIComponent(decodeURIComponent(raw));
		if (tab === "word")
			return `/api/search/all/vi/word/?key=${key}&page=1&limit=50`;
		if (tab === "grammar") {
			let page = 1;
			const list = document.querySelector(".list-grammar");
			const parent = list?.parentElement;
			if (parent) {
				const pagination = parent.querySelector("app-pagination");
				if (pagination) {
					const input = pagination.querySelector('input[type="number"]');
					if (input) {
						const p = parseInt(input.value, 10);
						if (!isNaN(p) && p >= 1) page = p;
					}
				} else {
					const fallback = document.querySelector("input.quick-move");
					if (fallback) {
						const p = parseInt(fallback.value, 10);
						if (!isNaN(p) && p >= 1) page = p;
					}
				}
			}
			return `/api/search/all/vi/grammar/?key=${key}&page=${page}&limit=24`;
		}
		return null;
	}

	function escHtml(s) {
		const d = document.createElement("div");
		d.textContent = s;
		return d.innerHTML;
	}

	function normalizeMean(t) {
		return t.replace(/^\d+\.\s*/, "").trim();
	}

	function renderCollocationCm(cm, key) {
		const k = key || "";
		const c = cm || "";
		const idx = c.indexOf(k);
		if (idx < 0) return escHtml(c);
		let o = "";
		if (idx > 0) o += `<span class="query-matched">${escHtml(c.slice(0, idx))}</span>`;
		o += `<span class="matched">${escHtml(k)}</span>`;
		if (idx + k.length < c.length)
			o += `<span class="query-matched">${escHtml(c.slice(idx + k.length))}</span>`;
		return o;
	}

	function splitChineseChars(text) {
		let r = "";
		for (const ch of text) {
			if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
				r += `<span class="matched">${escHtml(ch)}</span>`;
			} else {
				r += escHtml(ch);
			}
		}
		return r;
	}

	const speakerSvg = `<svg viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" style="fill:var(--icon-primary);width:24px;height:24px;"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.6532 4.73424C20.0208 4.48787 20.5184 4.58609 20.7648 4.95363C23.6091 9.19681 23.6177 14.7934 20.7647 19.0465C20.5182 19.414 20.0205 19.5121 19.653 19.2656C19.2855 19.0191 19.1875 18.5214 19.434 18.1539C21.9241 14.4419 21.9171 9.55034 19.4338 5.84583C19.1874 5.47829 19.2857 4.98062 19.6532 4.73424Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M17.0984 7.3077C17.4858 7.09391 17.9732 7.23465 18.187 7.62205C19.689 10.3438 19.6896 13.6646 18.1864 16.379C17.972 16.7661 17.4844 16.9061 17.0973 16.6917C16.7103 16.4773 16.5703 15.9898 16.7846 15.6027C18.0199 13.3721 18.0206 10.637 16.784 8.39626C16.5703 8.00885 16.711 7.52149 17.0984 7.3077Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8.77847 4.79254C9.79559 4.13167 11.2118 3.51569 12.7254 4.41264C12.7444 4.42388 12.7629 4.43589 12.7808 4.44864C13.5674 5.00712 14.0973 5.79043 14.4224 6.995C14.7371 8.16096 14.8701 9.75702 14.8701 11.9998C14.8701 14.2449 14.7305 15.845 14.4125 17.0129C14.0848 18.2161 13.5563 19 12.781 19.5508C12.7631 19.5636 12.7446 19.5756 12.7257 19.5868C11.2121 20.4844 9.79574 19.8687 8.77847 19.2078C8.39389 18.9579 8.01505 18.6675 7.68383 18.4137C7.57896 18.3333 7.47886 18.2566 7.38487 18.186C6.95287 17.8614 6.6597 17.674 6.44639 17.6037C5.98977 17.4535 5.63323 17.4108 5.2306 17.3626C5.08283 17.345 4.92884 17.3265 4.76143 17.3018C4.13712 17.2094 3.48504 17.0324 2.78349 16.4367C2.05302 15.8166 1.71419 15.0051 1.55413 14.2228C1.39834 13.4612 1.4001 12.6617 1.40153 12.0122L1.40156 12.0015V11.998L1.40153 11.9874C1.4001 11.3379 1.39834 10.5383 1.55413 9.77679C1.71419 8.99442 2.05303 8.18295 2.78354 7.56279C3.48515 6.96769 4.13745 6.79085 4.76143 6.69855C4.92805 6.6739 5.0814 6.6555 5.2286 6.63785C5.63191 6.58947 5.98903 6.54664 6.44624 6.3959C6.65934 6.32583 6.95302 6.13845 7.38498 5.81405C7.4792 5.7433 7.57955 5.66641 7.68471 5.58584C8.0157 5.33223 8.39426 5.04218 8.77847 4.79254ZM6.94734 7.91789C6.32297 8.12366 5.75292 8.19116 5.32195 8.24219C5.20186 8.25641 5.09257 8.26935 4.99591 8.28365C4.5532 8.34914 4.21911 8.44635 3.82055 8.78433C3.45175 9.09742 3.23948 9.53336 3.12398 10.0979C3.00535 10.6778 3.00242 11.3186 3.00391 11.998V12.0015C3.00242 12.681 3.00535 13.3218 3.12398 13.9016C3.23948 14.4662 3.45175 14.9022 3.82055 15.2153C4.21929 15.5538 4.55344 15.6512 4.99591 15.7167C5.09276 15.731 5.20237 15.7439 5.32287 15.7582C5.75368 15.8091 6.32366 15.8765 6.94749 16.0817C7.44602 16.246 7.93625 16.5961 8.34731 16.9049C8.46698 16.9948 8.58346 17.084 8.6983 17.172C9.01745 17.4165 9.324 17.6513 9.65149 17.8641C10.5256 18.4321 11.2008 18.6122 11.8803 18.2249C12.2835 17.93 12.6213 17.492 12.8664 16.5919C13.1267 15.6361 13.2677 14.2102 13.2677 11.9998C13.2677 9.78704 13.1327 8.36581 12.8754 7.41254C12.6338 6.51742 12.2972 6.07892 11.8806 5.77487C11.2011 5.38778 10.5258 5.56813 9.65149 6.13618C9.32426 6.3488 9.01801 6.58336 8.69918 6.82755C8.58402 6.91575 8.46722 7.00521 8.34719 7.09534C7.9361 7.40406 7.44607 7.75391 6.94734 7.91789Z"></path></svg>`;

	// ── Inject extra examples into a meaning block ─────────────────
	function injectExtraExamples(lockBtn, allExamples, startNum = 1) {
		const mainContent = lockBtn.closest(".main-content");
		if (!mainContent) return false;
		const listExam = mainContent.querySelector(".list-exam");
		if (!listExam) return false;

		lockBtn.classList.add("unlocked");
		lockBtn.remove();

		allExamples.forEach((ex, i) => {
			if (!ex.e && !ex.m) return;
			const el = document.createElement("example");
			el.style.display = "block";
			const num = startNum + i;
			const exId = ex.id ?? 0;
			const exType = ex.type || "e_cnvi";
			const attr = "_ngcontent-ng-c1786103367";
			el.innerHTML = `
				<div ${attr} class="box-example">
					<div ${attr} class="flex-center gap-8 font-18 fw-400 cl-pr-sm">
						<span data-voice="0" onclick="var v=parseInt(this.dataset.voice);this.dataset.voice=((v+1)%2);new Audio('https://audio.hanzii.net/audios/${exType}/'+v+'/${exId}.mp3').play().catch(function(){})" style="cursor:pointer;display:inline-flex;align-items:center;width:24px;height:24px;">${speakerSvg}</span>
						<simple-tradition ${attr} _nghost-ng-c1866329330 class="wrap-convert"><span _ngcontent-ng-c1866329330 class="simple-tradition-wrap">${splitChineseChars(ex.e || "")}</span></simple-tradition>
					</div>
					<div ${attr} class="font-16 fw-400 cl-se-sm txt-pinyin ex-phonetic">${escHtml(ex.p || ex.p_cn || "")}</div>
					<div ${attr} class="font-16 fw-400 cl-pr-sm">${escHtml(ex.m || "")}</div>
				</div>
			`;
			listExam.appendChild(el);
		});
		return true;
	}

	// ── Unlock word examples ───────────────────────────────────────
	function unlockExamples(result) {
		if (!result.content) return;

		const meanMap = new Map();
		for (const c of result.content) {
			if (!c.means) continue;
			for (const m of c.means) {
				if (m.mean) meanMap.set(normalizeMean(m.mean), m.examples || []);
			}
		}

		const items = document.querySelectorAll(".content-item");
		for (const item of items) {
			const lockBtn = item.querySelector(".btn-primary");
			if (!lockBtn) continue;
			const meanEl = item.querySelector('[class*="txt-mean"]');
			if (!meanEl) continue;
			const norm = normalizeMean(meanEl.textContent || "");
			const allEx = meanMap.get(norm);
			if (allEx && allEx.length > 1) {
				injectExtraExamples(lockBtn, allEx.slice(1));
			}
		}
	}

	// ── Unlock compound/synonym/antonym lists ──────────────────────
	function unlockWordList(items, heading) {
		if (!items || items.length === 0) return;

		const toggle = heading.closest('[class*="title-toogle"]');
		if (!toggle) return;
		const bottomEl = toggle.nextElementSibling;
		if (!bottomEl || !bottomEl.classList.contains("bottom-toogle")) return;

		// Remove the "Mở khóa" button
		const lockBtn = bottomEl.querySelector(".btn-primary.show-more, .btn-primary");
		if (lockBtn) {
			lockBtn.classList.add("unlocked");
			lockBtn.remove();
		}

		// Count how many items are already shown
		const existing = bottomEl.querySelectorAll(
			'.txt-compound, [class*="txt-compound"]',
		);
		const shown = existing.length;

		if (shown >= items.length) return;

		// Find the container to add new items to
		const compoundContainer =
			bottomEl.querySelector(".compound") || bottomEl;
		let refNode = bottomEl.querySelector(".compound > :last-child") || null;

		for (let i = shown; i < items.length; i++) {
			const w = items[i].trim();
			if (!w) continue;

			const div = document.createElement("div");
			div.className = "txt-compound d-flex";
			div.style.cssText =
				"display:flex;align-items:center;gap:6px;padding:6px 0;font-size:15px;";
			div.innerHTML = `
				<span class="icon-index" style="min-width:24px;color:#999;">${i + 1}. </span>
				<div>
					<simple-tradition class="wrap-convert">${escHtml(w)}</simple-tradition>
				</div>
			`;
			compoundContainer.appendChild(div);
		}
	}

	// ── Kanji example API (same AES-CBC encryption) ───────────────
	let exampleApiCache = new Map();

	async function fetchExampleData(char) {
		if (exampleApiCache.has(char)) return exampleApiCache.get(char);
		const url = `https://api2.hanzii.net/api/search/all/vi/example/?key=${encodeURIComponent(char)}&page=1&limit=24`;
		const resp = await fetch(url, {
			headers: { Accept: "application/json, text/plain, */*" },
		});
		if (!resp.ok) return null;
		const json = await resp.json();
		const data = json.data ? await decryptData(json.data) : null;
		if (data?.result) exampleApiCache.set(char, data.result);
		return data?.result || null;
	}

	// ── Mnemonic data (ihanzi_vi.json) ───────────────────────────────
	let mnemonicsCache = null;

	async function getMnemonics() {
		if (mnemonicsCache) return mnemonicsCache;
		try {
			const resp = await fetch(
				"https://hanzii.net/assets/db/hanzi/ihanzi_vi.json",
			);
			if (!resp.ok) return null;
			mnemonicsCache = await resp.json();
			return mnemonicsCache;
		} catch {
			return null;
		}
	}

	// ── Unlock kanji page ────────────────────────────────────────────
	async function unlockKanji() {
		const m = location.pathname.match(/\/search\/kanji\/(.+)/);
		if (!m) return;
		const raw = decodeURIComponent(m[1]);
		const chars = [...raw].filter((c) => c.match(/[\u4e00-\u9fff]/));
		if (chars.length === 0) return;

		const char = chars[0];

		// 1. Unlock examples under "Ví dụ:" (inside .list-exam containers)
		const listExams = document.querySelectorAll(".list-exam");
		for (const container of listExams) {
			const lockBtn = container.querySelector(".btn-primary");
			if (!lockBtn || lockBtn.classList.contains("unlocked")) continue;
			if (!lockBtn.textContent.includes("Mở khóa")) continue;

			const examples = await fetchExampleData(char);
			if (!examples || examples.length <= 1) continue;

			lockBtn.classList.add("unlocked");

			const shownCount = container.querySelectorAll("example").length;
			for (let i = shownCount; i < examples.length; i++) {
				const ex = examples[i];
				if (!ex.e && !ex.m) continue;
				const el = document.createElement("example");
				el.style.display = "block";
				const num = i + 1 - shownCount;
				const exId = ex.id ?? 0;
				const exType = ex.type || "e_cnvi";
				const attr = "_ngcontent-ng-c1786103367";
				el.innerHTML = `
					<div ${attr} class="box-example">
						<div ${attr} class="flex-center gap-8 font-18 fw-400 cl-pr-sm">
							<span data-voice="0" onclick="var v=parseInt(this.dataset.voice);this.dataset.voice=((v+1)%2);new Audio('https://audio.hanzii.net/audios/${exType}/'+v+'/${exId}.mp3').play().catch(function(){})" style="cursor:pointer;display:inline-flex;align-items:center;width:24px;height:24px;">${speakerSvg}</span>
							<simple-tradition ${attr} _nghost-ng-c1866329330 class="wrap-convert"><span _ngcontent-ng-c1866329330 class="simple-tradition-wrap">${splitChineseChars(ex.e || "")}</span></simple-tradition>
						</div>
						<div ${attr} class="font-16 fw-400 cl-se-sm txt-pinyin ex-phonetic">${escHtml(ex.p || ex.p_cn || "")}</div>
						<div ${attr} class="font-16 fw-400 cl-pr-sm">${escHtml(ex.m || "")}</div>
					</div>
				`;
				container.insertBefore(el, lockBtn);
			}

			lockBtn.remove();
		}

		// 2. Unlock mnemonic tips under "Mẹo Hán tự:"
		const mnemonics = await getMnemonics();
		if (!mnemonics) return;

		const meoHeadings = document.querySelectorAll(".box-title");
		for (const heading of meoHeadings) {
			if (!heading.textContent.includes("Mẹo Hán tự")) continue;
			const parent = heading.parentElement;
			const lockBtn = parent.querySelector(".btn-primary");
			if (!lockBtn || lockBtn.classList.contains("unlocked")) continue;
			if (!lockBtn.textContent.includes("Mở khóa")) continue;

			const textDiv = parent.querySelector(".ex-mean");
			if (!textDiv) continue;

			const entry = mnemonics[char];
			if (!entry?.remember) continue;

			lockBtn.classList.add("unlocked");
			textDiv.textContent = entry.remember;
			lockBtn.remove();
		}
	}

	// ── Grammar unlock (custom modal) ────────────────────────────
	// Cannot use Angular's native broadcaster/modal in production mode
	// (all __ngContext__ are TNode indices, no LViews on DOM).
	// Instead: fetch grammar data, remove lock SVGs, intercept clicks,
	// and show a custom floating modal that matches Hanzii's UI.

	let grammarDataCache = null;
	let grammarApiPath = "";

	function grammarItemToTitle(item) {
		return (item.title || "").replace(/[【】]/g, "").trim();
	}

	function getGrammarLevel(level) {
		const map = { A1: "HSK1", A2: "HSK2", B1: "HSK3", B2: "HSK4", C1: "HSK5", C2: "HSK6" };
		return map[level] || level || "";
	}

	const closeSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.70734 4.46566L19.3618 18.1201C19.7524 18.5107 19.7524 19.1438 19.3618 19.5343C18.9713 19.9249 18.3381 19.9249 17.9476 19.5343L4.29313 5.87987C3.90261 5.48935 3.90261 4.85618 4.29313 4.46566C4.68365 4.07513 5.31682 4.07513 5.70734 4.46566Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4.29305 18.1201L17.9475 4.46564C18.338 4.07512 18.9712 4.07512 19.3617 4.46564C19.7523 4.85617 19.7523 5.48933 19.3617 5.87986L5.70726 19.5343C5.31674 19.9249 4.68358 19.9249 4.29305 19.5343C3.90253 19.1438 3.90253 18.5106 4.29305 18.1201Z"></path></svg>`;

	function showGrammarModal(item) {
		const existing = document.querySelector(".hgm-overlay");
		if (existing) existing.remove();

		const level = getGrammarLevel(item.level);
		const contents = item.contents || [];
		const examples = item.examples || [];

		let bodyHtml = "";
		if (item.use_for) {
			bodyHtml += `<div class="hgm-section-label">Cách dùng</div>`;
			bodyHtml += `<div class="hgm-use-for">${splitChineseChars(item.use_for)}</div>`;
		}
		for (const p of contents) {
			bodyHtml += `<div class="hgm-content">${splitChineseChars(p)}</div>`;
		}
		if (examples.length) {
			bodyHtml += `<div class="hgm-section-label">Ví dụ</div>`;
			for (const ex of examples) {
				if (!ex.e) continue;
				bodyHtml += `<div class="hgm-example">`;
				bodyHtml += `<div class="hgm-example-cn"><span class="hgm-speaker" aria-label="Phát âm">${speakerSvg}</span><span>${splitChineseChars(ex.e)}</span></div>`;
				if (ex.p) bodyHtml += `<div class="hgm-example-py">${escHtml(ex.p)}</div>`;
				if (ex.m) bodyHtml += `<div class="hgm-example-mean">${escHtml(ex.m)}</div>`;
				bodyHtml += `</div>`;
			}
		}

		const overlay = document.createElement("div");
		overlay.className = "hgm-overlay";
		overlay.innerHTML = `
			<div class="hgm-panel">
				<div class="hgm-header">
					<div class="hgm-header-left">
						<div class="hgm-title">${escHtml(item.title || "")}</div>
						${level ? `<span class="hgm-badge">${level}</span>` : ""}
					</div>
					<button class="hgm-close" aria-label="Đóng">${closeSvg}</button>
				</div>
				<div class="hgm-body">${bodyHtml}</div>
			</div>
		`;

		document.body.appendChild(overlay);
		injectGrammarModalStyles();
		requestAnimationFrame(() => overlay.classList.add("show"));

		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) {
				overlay.classList.remove("show");
				setTimeout(() => overlay.remove(), 250);
			}
		});
		overlay.querySelector(".hgm-close").addEventListener("click", () => {
			overlay.classList.remove("show");
			setTimeout(() => overlay.remove(), 250);
		});
		document.addEventListener("keydown", function onEscape(e) {
			if (e.key === "Escape") {
				overlay.classList.remove("show");
				setTimeout(() => overlay.remove(), 250);
				document.removeEventListener("keydown", onEscape);
			}
		});
	}

	function injectGrammarModalStyles() {
		if (document.getElementById("hgm-styles")) return;
		const style = document.createElement("style");
		style.id = "hgm-styles";
		style.textContent = `
			.hgm-overlay {
				position: fixed; inset: 0; z-index: 99999;
				background: rgba(0,0,0,.45);
				display: flex; align-items: center; justify-content: center;
				opacity: 0; transition: opacity .2s;
				pointer-events: none;
			}
			.hgm-overlay.show { opacity: 1; pointer-events: auto; }
			.hgm-panel {
				background: #fff; border-radius: 16px;
				width: 92%; max-width: 720px; max-height: 85vh;
				display: flex; flex-direction: column;
				overflow: hidden;
			}
			.hgm-header {
				display: flex; align-items: center; justify-content: space-between;
				padding: 18px 24px;
				border-bottom: 1px solid #eee;
				flex-shrink: 0;
			}
			.hgm-header-left {
				display: flex; align-items: center; gap: 12px;
				min-width: 0;
			}
			.hgm-title {
				font-size: 18px; font-weight: 600; color: #222;
				overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
			}
			.hgm-badge {
				flex-shrink: 0;
				display: inline-block; padding: 3px 10px;
				border-radius: 999px;
				font-size: 12px; font-weight: 600;
				background: #e8f4fd; color: #1976d2;
			}
			.hgm-close {
				flex-shrink: 0;
				width: 32px; height: 32px; border-radius: 50%;
				border: none; background: #f2f2f2; cursor: pointer;
				display: flex; align-items: center; justify-content: center;
				padding: 0; transition: background .15s;
			}
			.hgm-close:hover { background: #e0e0e0; }
			.hgm-close svg { width: 18px; height: 18px; fill: #666; }
			.hgm-body {
				padding: 20px 24px; overflow-y: auto; flex: 1;
			}
			.hgm-section-label {
				font-size: 13px; font-weight: 600; color: #999;
				text-transform: uppercase; letter-spacing: .5px;
				margin: 16px 0 8px;
			}
			.hgm-section-label:first-child { margin-top: 0; }
			.hgm-use-for {
				font-size: 15px; color: #555; line-height: 1.6;
				padding: 10px 14px; background: #f5f7fa; border-radius: 8px;
				margin-bottom: 12px;
			}
			.hgm-content {
				font-size: 15px; color: #333; line-height: 1.7;
				margin: 6px 0;
			}
			.hgm-example {
				margin: 10px 0; padding: 12px 16px;
				background: #f5f8ff; border-radius: 10px;
				border-left: 3px solid #90caf9;
			}
			.hgm-example-cn {
				display: flex; align-items: center; gap: 8px;
				font-size: 18px; font-weight: 500; color: #222;
			}
			.hgm-speaker {
				display: flex; cursor: pointer; flex-shrink: 0;
			}
			.hgm-speaker svg { width: 22px; height: 22px; fill: var(--icon-primary, #555); }
			.hgm-example-py {
				font-size: 14px; color: #888; margin-top: 4px;
			}
			.hgm-example-mean {
				font-size: 15px; color: #333; margin-top: 4px;
			}
			.hgm-content .matched,
			.hgm-use-for .matched,
			.hgm-example-cn .matched {
				color: #1565c0; font-weight: 600;
			}
		`;
		document.head.appendChild(style);
	}

	const aiIconSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill:#6366f1;width:20px;height:20px;"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.3522 3.44018C18.8014 4.80075 19.1707 5.1709 20.5283 5.62109C21.1172 5.82117 21.1172 6.63151 20.5283 6.83159C19.1707 7.28178 18.8014 7.65194 18.3522 9.0125C18.1526 9.60275 17.344 9.60275 17.1444 9.0125C16.6952 7.65194 16.3259 7.28178 14.9683 6.83159C14.6788 6.74156 14.5291 6.49145 14.5291 6.23134C14.5291 5.97124 14.6788 5.72113 14.9683 5.62109C16.3259 5.1709 16.6952 4.80075 17.1444 3.44018C17.344 2.84994 18.1526 2.84994 18.3522 3.44018ZM15.9964 11.1234L18.0028 11.7036V11.6936C18.5818 11.8637 18.991 12.4039 18.991 13.0142C18.991 13.6244 18.5818 14.1647 17.9928 14.3347L15.9865 14.905C14.4692 15.3451 13.3013 16.5056 12.8721 18.0263L12.2931 20.0371C12.1234 20.6073 11.6044 20.9975 10.9755 20.9975C10.3467 20.9975 9.82759 20.6173 9.65789 20.0371L9.07894 18.0263C8.63973 16.5056 7.48182 15.3351 5.96456 14.905L3.95819 14.3247C3.37923 14.1546 2.96997 13.6144 2.96997 13.0042C2.96997 12.3939 3.37923 11.8537 3.96817 11.6836L5.97455 11.1134C7.49181 10.6732 8.6597 9.51271 9.08892 7.99208L9.66788 5.98124C9.83757 5.401 10.3766 4.99083 10.9855 4.99083C11.5944 4.99083 12.1334 5.401 12.3031 5.98124L12.8821 8.00208C13.3213 9.52272 14.4792 10.6932 15.9964 11.1234Z"></path></svg>`;

	function showAIModal(data, word) {
		const existing = document.querySelector(".hgm-overlay");
		if (existing) existing.remove();

		const qas = data.result[0].chat_gpt;
		const pinyin = data.result[0].pinyin || getPinyinFromDom();
		const wordDisplay = splitChineseChars(word);

		let bodyHtml = "";
		for (const qa of qas) {
			bodyHtml += `<div class="hgm-ai-item">`;
			bodyHtml += `<div class="hgm-ai-question"><span class="hgm-ai-icon">${aiIconSvg}</span><span>${escHtml(qa.question)}</span></div>`;
			bodyHtml += `<div class="hgm-ai-answer">${escHtml(qa.answer)}</div>`;
			bodyHtml += `</div>`;
		}

		const overlay = document.createElement("div");
		overlay.className = "hgm-overlay";
		overlay.innerHTML = `
			<div class="hgm-panel hgm-ai-panel">
				<div class="hgm-header">
					<div class="hgm-header-left">
						<div class="hgm-title hgm-ai-title">${wordDisplay} <span class="hgm-ai-pinyin">[${escHtml(pinyin)}]</span></div>
					</div>
					<button class="hgm-close" aria-label="Đóng">${closeSvg}</button>
				</div>
				<div class="hgm-body">${bodyHtml}</div>
			</div>
		`;

		document.body.appendChild(overlay);
		injectAIModalStyles();
		injectGrammarModalStyles();
		requestAnimationFrame(() => overlay.classList.add("show"));

		overlay.addEventListener("click", (e) => {
			if (e.target === overlay) {
				overlay.classList.remove("show");
				setTimeout(() => overlay.remove(), 250);
			}
		});
		overlay.querySelector(".hgm-close").addEventListener("click", () => {
			overlay.classList.remove("show");
			setTimeout(() => overlay.remove(), 250);
		});
		document.addEventListener("keydown", function onEscape(e) {
			if (e.key === "Escape") {
				overlay.classList.remove("show");
				setTimeout(() => overlay.remove(), 250);
				document.removeEventListener("keydown", onEscape);
			}
		});
	}

	function injectAIModalStyles() {
		if (document.getElementById("hgm-ai-styles")) return;
		const style = document.createElement("style");
		style.id = "hgm-ai-styles";
		style.textContent = `
			.hgm-ai-panel { max-width: 640px; }
			.hgm-ai-title { display: flex; align-items: center; gap: 8px; }
			.hgm-ai-pinyin { font-size: 14px; font-weight: 400; color: #888; }
			.hgm-ai-item { margin-bottom: 12px; }
			.hgm-ai-question {
				display: flex; align-items: flex-start; gap: 8px;
				font-size: 15px; font-weight: 600; color: #333;
				line-height: 1.5; padding: 10px 14px;
				background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
				border-radius: 10px 10px 4px 10px;
			}
			.hgm-ai-icon {
				flex-shrink: 0; margin-top: 2px;
				display: flex; align-items: center;
			}
			.hgm-ai-icon svg { display: block; }
			.hgm-ai-answer {
				font-size: 14px; color: #444; line-height: 1.7;
				padding: 10px 14px 10px 40px;
				border-left: 2px solid #e0e7ff;
				margin: 2px 0 0 4px;
			}
		`;
		document.head.appendChild(style);
	}

	async function unlockGrammar() {
		// Hide lock SVGs via CSS rule (survives Angular re-render)
		if (!document.getElementById("hgm-hide-locks")) {
			const style = document.createElement("style");
			style.id = "hgm-hide-locks";
			style.textContent = `[name="fill_lock"] { display: none !important; }`;
			document.head.appendChild(style);
		}

		const list = document.querySelector(".list-grammar");
		if (!list) return;

		// Fetch API data for current page
		const apiPath = getApiPath();
		if (!apiPath) return;

		if (grammarApiPath !== apiPath) {
			grammarDataCache = null;
			grammarApiPath = apiPath;
		}

		if (!grammarDataCache) {
			const data = await fetchWordData(apiPath);
			if (!data?.result || data.result.length === 0) return;
			grammarDataCache = data.result;
		}
	}

	// ── AI / ChatGPT ────────────────────────────────────────────────
	const aiCache = new Map();

	/**
	 * Extract pinyin from DOM near the AI button.
	 * Looks for the first .txt-pinyin in the same parent container.
	 */
	function getPinyinFromDom() {
		const btn = document.querySelector(".btn-chatgpt");
		if (!btn) return "";
		const row = btn.closest(".font-18\\, .flex-center") || btn.parentElement;
		const span = row?.querySelector(".txt-pinyin");
		if (!span) return "";
		const txt = span.textContent.replace(/[[\]]/g, "").trim();
		return txt;
	}

	async function fetchAIData(word) {
		const key = word;
		if (aiCache.has(key)) return aiCache.get(key);
		const pinyin = getPinyinFromDom();
		const url = `https://api.hanzii.net/api/v2/search/vi/chatgpt/${encodeURIComponent(word)}?pinyin=${encodeURIComponent(pinyin)}`;
		const resp = await fetch(url, {
			headers: { Accept: "application/json, text/plain, */*" },
		});
		if (!resp.ok) return null;
		const json = await resp.json();
		if (!json.data) return null;
		const data = await decryptData(json.data);
		if (data) aiCache.set(key, data);
		return data;
	}

	// ── Collocation API (plain JSON, no encryption) ─────────────────
	let collocationCache = new Map();

	async function fetchCollocationData(key) {
		if (collocationCache.has(key)) return collocationCache.get(key);
		const url = `https://api2.hanzii.net/api/search/collocation/${encodeURIComponent(key)}`;
		const resp = await fetch(url, {
			headers: { Accept: "application/json, text/plain, */*" },
		});
		if (!resp.ok) return null;
		const json = await resp.json();
		if (!json?.result?.coll) return null;
		collocationCache.set(key, json.result.coll);
		return json.result.coll;
	}

	// ── Unlock collocations page ───────────────────────────────────
	async function unlockCollocations() {
		const m = location.pathname.match(/\/search\/collocations\/(.+)/);
		if (!m) return;
		const key = decodeURIComponent(m[1]);

		const groups = await fetchCollocationData(key);
		if (!groups || groups.length === 0) return;

		const containers = document.querySelectorAll(".bg-inverse.mb-12");
		for (const container of containers) {
			const viewMore = container.querySelector(".view-more");
			if (!viewMore || viewMore.classList.contains("unlocked")) continue;

			const header = container.querySelector(".coll-header");
			if (!header) continue;

			const singleColl = container.querySelector(".single-coll-item");
			if (!singleColl) continue;

			const shownItems = singleColl.querySelectorAll(".collocation-item");
			const shown = shownItems.length;

			const headingText = header.textContent || "";
			const totalMatch = headingText.match(/\((\d+)\)/);
			const total = totalMatch ? parseInt(totalMatch[1]) : 0;
			if (total <= shown) continue;

			viewMore.classList.add("unlocked");

			const allContents = groups.flatMap((g) => g.contents || []);
			if (allContents.length <= shown) {
				viewMore.remove();
				continue;
			}

			const attr = "_ngcontent-ng-c4220045947";
			let refItem = shownItems[shownItems.length - 1];
			for (let i = shown; i < Math.min(allContents.length, total); i++) {
				const item = allContents[i];
				if (!item?.cm) continue;
				const num = i + 1;
				const colEl = document.createElement("div");
				colEl.className =
					"card-primary card-sm flex-column gap-12 collocation-item cursor-pointer";
				colEl.setAttribute(attr, "");
				colEl.innerHTML = `
					<div ${attr} class="d-flex space-between">
						<div ${attr} class="font-18 fw-400 cl-pr-lg child-top">
							<span ${attr}>${num}. </span>
							<simple-tradition ${attr} _nghost-ng-c1866329330 class="wrap-convert"><span _ngcontent-ng-c1866329330 class="simple-tradition-wrap">${renderCollocationCm(item.cm, item.key)}</span></simple-tradition>
						</div>
						<div ${attr} class="icon-audio">
							<span data-txt="${escHtml(item.cm || "")}" onclick="var t=this.dataset.txt;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';speechSynthesis.speak(u)" style="cursor:pointer;display:inline-flex;align-items:center;width:24px;height:24px;">${speakerSvg}</span>
						</div>
					</div>
					<div ${attr} class="font-15 fw-400 cl-te-sm pinyin">${escHtml(item.p || "")}</div>
				`;
				refItem.insertAdjacentElement("afterend", colEl);
				refItem = colEl;
			}

			viewMore.remove();
		}
	}

	// ── Main entry ─────────────────────────────────────────────────
	async function unlock() {
		if (location.href === lastDoneUrl) return;
		lastDoneUrl = location.href;

		if (location.pathname.startsWith("/search/kanji/")) {
			await unlockKanji();
			console.log("[Hanzii Unlocker] ✅ Kanji done:", location.pathname);
			return;
		}

		if (location.pathname.startsWith("/search/collocations/")) {
			await unlockCollocations();
			console.log("[Hanzii Unlocker] ✅ Collocations done:", location.pathname);
			return;
		}

		if (location.pathname.startsWith("/search/grammar/")) {
			const firstRun = !grammarDataCache;
			await unlockGrammar();
			if (firstRun) console.log("[Hanzii Unlocker] ✅ Grammar done:", location.pathname);
			return;
		}

		const apiPath = getApiPath();
		if (!apiPath) return;

		const data = await fetchWordData(apiPath);
		if (!data?.result?.[0]) return;

		const result = data.result[0];

		// Unlock examples (for word tab)
		if (result.content) unlockExamples(result);

		// Unlock compounds
		if (result.compound) {
			const compounds = result.compound.split(";").filter(Boolean);
			const h = Array.from(document.querySelectorAll("h2, h3")).find((el) =>
				el.textContent.trim().includes("Từ ghép"),
			);
			if (h) unlockWordList(compounds, h);
		}

		// Unlock synonyms
		if (result.snym?.syno?.length) {
			const h = Array.from(document.querySelectorAll("h2, h3")).find((el) =>
				el.textContent.trim().includes("Từ cận nghĩa"),
			);
			if (h) unlockWordList(result.snym.syno, h);
		}

		// Unlock antonyms
		if (result.snym?.anto?.length) {
			const h = Array.from(document.querySelectorAll("h2, h3")).find((el) =>
				el.textContent.trim().includes("Từ trái nghĩa"),
			);
			if (h) unlockWordList(result.snym.anto, h);
		}

		// Cleanup: remove any remaining standalone lock buttons
		document.querySelectorAll(".btn-primary:not(.unlocked)").forEach((btn) => {
			if (btn.textContent.includes("Mở khóa")) {
				btn.classList.add("unlocked");
				btn.remove();
			}
		});

		console.log("[Hanzii Unlocker] ✅ Done:", location.pathname);
	}

	// ── Reactive scheduling (no setInterval/setTimeout) ────────────
	let unlockBusy = false;
	let lastUrl = location.href;
	let lastKey = "";
	let pendingUnlock = false;
	let lastDoneUrl = "";

	async function tryUnlock() {
		if (unlockBusy) return;
		if (!location.pathname.startsWith("/search/")) return;

		// Grammar pages: unlock (idempotent, cache-backed, no busy guard)
		if (location.pathname.startsWith("/search/grammar/")) {
			const list = document.querySelector(".list-grammar");
			if (!list) return;
			await unlock();
			return;
		}

		const locks = document.querySelectorAll('.btn-primary:not(.unlocked)');
		if (locks.length === 0) return;

		const toggles = document.querySelectorAll(".bottom-toogle.active");
		const sum = [...toggles].reduce((s, t) => s + t.children.length, 0);
		const key = `${sum}:${locks.length}`;
		if (key === lastKey) return;
		lastKey = key;

		unlockBusy = true;
		try {
			await unlock();
		} finally {
			unlockBusy = false;
		}
	}

	function scheduleUnlock() {
		if (pendingUnlock) return;
		pendingUnlock = true;
		requestAnimationFrame(() => {
			pendingUnlock = false;
			tryUnlock();
		});
	}

	// URL change → reset cache, trigger unlock
	new MutationObserver(() => {
		if (location.href !== lastUrl) {
			lastUrl = location.href;
			lastKey = "";
			lastDoneUrl = "";
			scheduleUnlock();
		}
	}).observe(document, { subtree: true, childList: true });

	// Angular renders DOM synchronously during change detection (Zone.js).
	// MutationObserver fires AFTER the DOM is already updated — no delay needed.
	if (document.body) {
		new MutationObserver(() => {
			if (!document.hidden) scheduleUnlock();
		}).observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class"],
		});
	}

	// Initial unlock
	scheduleUnlock();
})();
