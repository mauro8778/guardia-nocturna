/**
 * Utilidad modular para convertir y descargar contenido Markdown generado por IA
 * a un documento de Microsoft Word (.doc / .docx) profesional y responsive.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += '<p style="margin: 6pt 0;"></p>\n';
      continue;
    }

    // Regla horizontal (---)
    if (/^---{3,}$/.test(line) || /^\*\*\*{3,}$/.test(line)) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      html += '<hr style="border: none; border-top: 2px solid #64748b; margin: 16pt 0;" />\n';
      continue;
    }

    // Títulos #, ##, ###
    if (line.startsWith('# ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h1 style="color: #0f172a; font-size: 18pt; font-weight: bold; margin-top: 14pt; margin-bottom: 8pt; border-bottom: 2px solid #2563eb; padding-bottom: 4pt;">${formatInline(line.slice(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h2 style="color: #1e293b; font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; background-color: #f1f5f9; padding: 4pt 8pt; border-left: 4px solid #2563eb;">${formatInline(line.slice(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h3 style="color: #334155; font-size: 12pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt;">${formatInline(line.slice(4))}</h3>\n`;
      continue;
    }

    // Viñetas - o *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul style="margin: 4pt 0 8pt 16pt; padding-left: 12pt;">\n';
        inList = true;
      }
      html += `<li style="margin-bottom: 4pt; color: #334155; font-size: 11pt;">${formatInline(line.slice(2))}</li>\n`;
      continue;
    }

    if (inList) {
      html += '</ul>\n';
      inList = false;
    }

    // Párrafos comunes
    html += `<p style="margin: 4pt 0; color: #334155; font-size: 11pt; line-height: 1.5;">${formatInline(line)}</p>\n`;
  }

  if (inList) {
    html += '</ul>\n';
  }

  return html;
}

function formatInline(text: string): string {
  let escaped = escapeHtml(text);
  // **negrita**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // *cursiva*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // `código`
  escaped = escaped.replace(/`(.*?)`/g, '<code style="background-color: #f1f5f9; color: #b91c1c; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
  return escaped;
}

export function downloadAsWordDoc(title: string, markdownContent: string, filename: string): void {
  const bodyHtml = parseMarkdownToHtml(markdownContent);

  const documentHtml = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: 0.5in;
      mso-footer-margin: 0.5in;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      background-color: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
    }
    td, th {
      border: 1px solid #cbd5e1;
      padding: 6pt 8pt;
      text-align: left;
      font-size: 10.5pt;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="Section1">
    <div style="text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 8pt; margin-bottom: 16pt;">
      <h1 style="color: #1e293b; font-size: 20pt; margin: 0; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(title)}</h1>
      <p style="color: #64748b; font-size: 9pt; margin-top: 4pt;">Generado profesionalmente con Guardia Docente IA</p>
    </div>
    ${bodyHtml}
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob(['\ufeff', documentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanFilename = filename.toLowerCase().endsWith('.doc') || filename.toLowerCase().endsWith('.docx')
    ? filename
    : `${filename}.doc`;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
