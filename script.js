function toggleHelp() {
    const box = document.getElementById('helpBox');
    const isShown = box.style.display === 'none';
    box.style.display = isShown ? 'block' : 'none';
    if (isShown && window.MathJax && typeof MathJax.typeset === "function") {
        MathJax.typeset();
    }
}

function toggleAllDetails(expand) {
    document.querySelectorAll("#helpBox details").forEach(sec => sec.open = expand);
}

document.getElementById("helpSearch").addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    const helpBox = document.getElementById("helpBox");
    const details = helpBox.querySelectorAll("details");

    let found = false;
    details.forEach(section => {
        const text = section.innerText.toLowerCase();
        if (text.includes(keyword)) {
            section.open = true;
            if (!found) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
                found = true;
            }
        } else {
            section.open = false;
        }
    });

    if (!found && keyword.length > 0) {
        alert("❗ Không tìm thấy từ khóa: " + keyword);
    }
});

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function clearNotes() {
    if (confirm("❗ Bạn có chắc chắn muốn xóa tất cả ghi chú không?")) {
        localStorage.removeItem("mathNote");
        document.getElementById("noteInput").value = "";
        document.getElementById("output").innerHTML = "";
    }
}

function buildTopicRegexMapFromHelpBox() {
    const topicMap = {};
    const details = document.querySelectorAll("#helpBox details");

    details.forEach(section => {
        const summaryEl = section.querySelector("summary");
        if (!summaryEl) return;

        const topic = summaryEl.textContent.trim().replace(/\s*\(.*?\)/, "");
        const codes = section.querySelectorAll("code");
        const patterns = [];

        codes.forEach(code => {
            const content = code.textContent;
            const exprs = content.split(",").map(e => e.trim());

            exprs.forEach(expr => {
                const cleanExpr = expr
                    .replace(/^\$/, "")
                    .replace(/\$$/, "")
                    .replace(/\s+/g, "")
                    .trim();

                if (cleanExpr.length < 1) return;

                const escaped = cleanExpr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(escaped);
                patterns.push(regex);
            });
        });

        if (topic && patterns.length > 0) {
            topicMap[topic] = patterns;
        }
    });

    return topicMap;
}

function convertToHTML(text) {
    const topicRegexMap = buildTopicRegexMapFromHelpBox();
    const lines = text.split("\n");

    const grouped = {};
    let other = [];

    for (let i = 0; i < lines.length; ++i) {
        let trimmed = lines[i].trim();
        if (!trimmed) continue;

        const mathExprMatches = [...trimmed.matchAll(/\$(.+?)\$/g)];
        for (const match of mathExprMatches) {
            try {
                let rawExpr = match[1]
                    .replace(/\\sqrt{(.+?)}/g, 'sqrt($1)')
                    .replace(/\\frac{(.+?)}{(.+?)}/g, '($1)/($2)')
                    .replace(/\\log_{10}\((.+?)\)/g, 'log10($1)')
                    .replace(/\\log\((.+?)\)/g, 'log($1)');
                const result = math.evaluate(rawExpr);
                if (!isNaN(result)) {
                    trimmed = trimmed.replace(
                        `$${match[1]}$`,
                        `$${match[1]}$ <span class="subnote">= ${result}</span>`
                    );
                }
            } catch {}
        }

        let html = "";
        if (/^[-*•]/.test(trimmed)) {
            html += `<li>${trimmed.slice(1).trim()}`;
            const next = lines[i + 1]?.trim();
            if (next && !/^[-*•]/.test(next)) {
                html += `<div class="subnote">${next}</div>`;
                ++i;
            }
            html += "</li>";
        } else {
            html += `<li style="list-style-type:none">${trimmed}</li>`;
        }

        let matchedTopics = new Set();
        const exprMatches = [...trimmed.matchAll(/\$(.+?)\$/g)];
        for (const match of exprMatches) {
            for (const [topic, regexList] of Object.entries(topicRegexMap)) {
                if (regexList.some(r => r.test(match[1].replace(/\s+/g, "")))) {
                    matchedTopics.add(topic);
                }
            }
        }

        if (matchedTopics.size > 0) {
            for (const topic of matchedTopics) {
                if (!grouped[topic]) grouped[topic] = [];
                grouped[topic].push(html);
            }
        } else {
            other.push(html);
        }
    }

    let resultHTML = "";
    const topicOrder = Object.keys(topicRegexMap);
    for (const topic of topicOrder) {
        if (!grouped[topic]) continue;
        const items = grouped[topic];
        resultHTML += `<h3>${topic}</h3><ul>${items.join("")}</ul>`;
    }

    if (other.length) {
        resultHTML += `<h3>📄 Khác</h3><ul>${other.join("")}</ul>`;
    }

    return resultHTML;
}

function updatePreview(text = null) {
    const input = document.getElementById("noteInput");
    const content = text ?? input.value;
    const output = document.getElementById("output");

    localStorage.setItem("mathNote", content);
    const rawHTML = convertToHTML(content);
    output.innerHTML = rawHTML;

    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().then(() => {
            output.scrollTop = output.scrollHeight;
        }).catch(() => {
            console.error("MathJax rendering failed.");
        });
    }
}

function handleSave() {
    const content = document.getElementById("noteInput").value;
    if (content.trim() === "") {
        alert("❗ Không có nội dung ghi chú để lưu.");
    } else {
        updatePreview();
        alert("📌 Đã lưu ghi chú!");
    }
}

window.onload = function () {
    const savedNote = localStorage.getItem("mathNote");
    if (savedNote) {
        document.getElementById("noteInput").value = savedNote;
        updatePreview(savedNote);
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

    document.getElementById("noteInput").addEventListener("input", () => updatePreview());
};
