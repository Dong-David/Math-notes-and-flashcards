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

            try {
                // Bỏ qua nếu chứa chữ cái hoặc dấu ngoặc nhọn {}
                if (/[a-zA-Z{}]/.test(latexExpr)) continue;

                // Thay thế LaTeX bằng biểu thức có thể hiểu bởi math.js
                let rawExpr = latexExpr
                    .replace(/\\sqrt{(.+?)}/g, 'sqrt($1)')
                    .replace(/\\sqrt\((.+?)\)/g, 'sqrt($1)')
                    .replace(/\\frac{(.+?)}{(.+?)}/g, '($1)/($2)')
                    .replace(/\\cdot/g, '*')
                    .replace(/\^/g, '**'); // chuyển ^ thành ** cho math.js

                // Loại bỏ dấu cách thừa (nếu có)
                rawExpr = rawExpr.trim();

                // Chỉ tính nếu không có biến
                if (!/[a-zA-Z{}]/.test(rawExpr)) {
                    const result = math.evaluate(rawExpr);
                    console.log("✅ Đã tính:", rawExpr, "→", result);
                
                    // Gắn kết quả vào HTML
                    trimmed = trimmed.replace(
                        `$${latexExpr}$`,
                        `$${latexExpr}$ <span class="subnote">= ${result}</span>`
                    );
                }
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
