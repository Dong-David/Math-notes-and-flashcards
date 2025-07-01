/* global math */
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

function convertToHTML(text) {
    console.log("▶️ Đang xử lý HTML từ ghi chú...");

    if (typeof math === "undefined") {
        console.error("❌ math.js chưa sẵn sàng!");
        return "<p style='color:red'>Không thể tính toán: math.js chưa được tải</p>";
    }

    const lines = text.split("\n");
    let html = "<ul>";

    for (let i = 0; i < lines.length; ++i) {
        let trimmed = lines[i].trim();
        if (!trimmed) continue;

        const mathExprMatches = [...trimmed.matchAll(/\$(.+?)\$/g)];
        for (const match of mathExprMatches) {
            const latexExpr = match[1];
            console.log("📥 latexExpr raw:", JSON.stringify(latexExpr));
            try {
                let rawExpr = latexExpr

                    // Mũ
                    .replace(/\^\{(.+?)\}/g, '**($1)')
                    .replace(/\^\{(.+?)\}/g, (_, inner) => `**(${inner})`)

                    // Phân số, căn, nhân
                    .replace(/\\frac{(.+?)}{(.+?)}/g, '($1)/($2)')
                    .replace(/\\sqrt{(.+?)}/g, 'sqrt($1)')
                    .replace(/\\cdot/g, '*')

                    // Lượng giác
                    .replace(/\\sin\{(.+?)\}/g, 'sin($1)')
                    .replace(/\\cos\{(.+?)\}/g, 'cos($1)')
                    .replace(/\\tan\{(.+?)\}/g, 'tan($1)')
                    .replace(/\\cot\{(.+?)\}/g, 'cot($1)')
                    .replace(/\\sec\{(.+?)\}/g, 'sec($1)')
                    .replace(/\\csc\{(.+?)\}/g, 'csc($1)')

                    // Hàm ngược
                    .replace(/\\arcsin\{(.+?)\}/g, 'asin($1)')
                    .replace(/\\arccos\{(.+?)\}/g, 'acos($1)')
                    .replace(/\\arctan\{(.+?)\}/g, 'atan($1)')

                    // Logarit
                    .replace(/\\log\{(.+?)\}/g, 'log10($1)')
                    .replace(/\\ln\{(.+?)\}/g, 'log($1)')

                    // Làm tròn
                    .replace(/\\floor\{(.+?)\}/g, 'floor($1)')
                    .replace(/\\ceil\{(.+?)\}/g, 'ceil($1)')
                    .replace(/\\round\{(.+?)\}/g, 'round($1)')

                    // max, min
                    .replace(/\\max\{(.+?)\}/g, 'max($1)')
                    .replace(/\\min\{(.+?)\}/g, 'min($1)')

                    // Hàm mũ, trị tuyệt đối
                    .replace(/\\exp\{(.+?)\}/g, 'exp($1)')
                    .replace(/\\abs\{(.+?)\}/g, 'abs($1)')

                    // hằng số
                    .replace(/\\pi/g, 'pi')
                    .replace(/\be\b/g, 'e') // giữ chữ e thường nếu không ở trong tên biến

                    .replace(/\\mod\{(.+?),\s*(.+?)\}/g, 'mod($1, $2)')
                    .replace(/\\gcd\{(.+?),\s*(.+?)\}/g, 'gcd($1, $2)')
                    .replace(/\\lcm\{(.+?),\s*(.+?)\}/g, 'lcm($1, $2)')

                    .trim();

                const result = math.evaluate(rawExpr);
                console.log("✅ Đã tính:", rawExpr, "→", result);
                console.log("📦 latexExpr =", latexExpr);

                trimmed = trimmed.replace(
                    `$${latexExpr}$`,
                    `$${latexExpr}$ <span class="subnote">= ${result}</span>`
                );
            } catch (e) {
                console.warn("⚠️ Không thể tính biểu thức:", latexExpr, e);
            }
        }

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
    }

    html += "</ul>";
    return html;
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
        }).catch((err) => {
            console.error("❗ MathJax rendering failed:", err);
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
    console.log("⚙️ math loại:", typeof math);  // 👉 phải là 'object'

    if (typeof math === 'undefined') {
        console.error("❗ math.js chưa được tải!");
        return;
    }

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