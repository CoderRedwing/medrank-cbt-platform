import katex from 'katex';
import 'katex/dist/katex.min.css';

/* Lightweight markdown + inline-math renderer for AI-generated text.
   Handles the subset of markdown the AI Tutor actually produces:
   headings (#/##/###), **bold**, *italic*, ~~strikethrough~~, `inline code`,
   [links](url), numbered/bulleted lists, blockquotes (>), tables (| a | b |),
   horizontal rules (---), and $...$ inline LaTeX (via KaTeX, same approach
   as the existing MathText component). Not a full markdown engine —
   deliberately small since this only needs to cover model output, not
   arbitrary user-authored markdown. */

const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Renders **bold**, *italic*, ~~strike~~, `code`, [text](url) and $math$
// within a single line of text into React nodes.
function renderInline(text, keyPrefix) {
    const nodes = [];
    const mathParts = text.split(/(\$[^$]+\$)/g);

    mathParts.forEach((part, i) => {
        if (/^\$[^$]+\$$/.test(part)) {
            const math = part.slice(1, -1);
            let html;
            try {
                html = katex.renderToString(math, { throwOnError: false, displayMode: false });
            } catch {
                html = escapeHtml(part);
            }
            nodes.push(<span key={`${keyPrefix}-m${i}`} dangerouslySetInnerHTML={{ __html: html }} />);
            return;
        }

        const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
        linkParts.forEach((lp, li) => {
            if (!lp) return;
            const linkMatch = lp.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                nodes.push(
                    <a key={`${keyPrefix}-lnk${i}-${li}`} href={linkMatch[2]} target="_blank" rel="noreferrer"
                       style={{ color: 'var(--clr-primary)', textDecoration: 'underline' }}>
                        {linkMatch[1]}
                    </a>
                );
                return;
            }

            const boldParts = lp.split(/(\*\*[^*]+\*\*)/g);
            boldParts.forEach((b, j) => {
                if (!b) return;
                if (/^\*\*[^*]+\*\*$/.test(b)) {
                    nodes.push(<strong key={`${keyPrefix}-b${i}-${li}-${j}`}>{b.slice(2, -2)}</strong>);
                    return;
                }

                const strikeParts = b.split(/(~~[^~]+~~)/g);
                strikeParts.forEach((s, si) => {
                    if (!s) return;
                    if (/^~~[^~]+~~$/.test(s)) {
                        nodes.push(<del key={`${keyPrefix}-s${i}-${li}-${j}-${si}`}>{s.slice(2, -2)}</del>);
                        return;
                    }

                    const codeParts = s.split(/(`[^`]+`)/g);
                    codeParts.forEach((c, k) => {
                        if (!c) return;
                        if (/^`[^`]+`$/.test(c)) {
                            nodes.push(
                                <code key={`${keyPrefix}-c${i}-${li}-${j}-${si}-${k}`} style={{
                                    background: 'var(--clr-surface2)', padding: '1px 5px', borderRadius: 4,
                                    fontSize: '0.9em', fontFamily: 'monospace', border: '1px solid var(--clr-border)',
                                }}>{c.slice(1, -1)}</code>
                            );
                            return;
                        }

                        const italicParts = c.split(/(\*[^*]+\*)/g);
                        italicParts.forEach((it, l) => {
                            if (!it) return;
                            if (/^\*[^*]+\*$/.test(it)) {
                                nodes.push(<em key={`${keyPrefix}-i${i}-${li}-${j}-${si}-${k}-${l}`}>{it.slice(1, -1)}</em>);
                            } else {
                                nodes.push(<span key={`${keyPrefix}-t${i}-${li}-${j}-${si}-${k}-${l}`}>{it}</span>);
                            }
                        });
                    });
                });
            });
        });
    });

    return nodes;
}

export default function MarkdownLite({ text, style, className }) {
    if (!text) return null;

    const lines = text.split('\n');
    const blocks = [];
    let listBuffer = null;  // { type: 'ol'|'ul', items: [] }
    let quoteBuffer = null; // string[]
    let tableBuffer = null; // { header: [...], rows: [[...], ...] }
    let paraBuffer = [];

    const flushList = () => {
        if (listBuffer) { blocks.push(listBuffer); listBuffer = null; }
    };
    const flushQuote = () => {
        if (quoteBuffer) { blocks.push({ type: 'blockquote', lines: quoteBuffer }); quoteBuffer = null; }
    };
    const flushTable = () => {
        if (tableBuffer) { blocks.push({ type: 'table', ...tableBuffer }); tableBuffer = null; }
    };
    const flushPara = () => {
        if (paraBuffer.length) {
            blocks.push({ type: 'p', text: paraBuffer.join(' ') });
            paraBuffer = [];
        }
    };

    lines.forEach((rawLine) => {
        const line = rawLine.trim();

        if (line === '') { flushList(); flushQuote(); flushTable(); flushPara(); return; }

        const heading = line.match(/^(#{1,4})\s+(.*)/);
        if (heading) {
            flushList(); flushQuote(); flushTable(); flushPara();
            blocks.push({ type: `h${heading[1].length}`, text: heading[2] });
            return;
        }

        if (/^-{3,}$/.test(line)) {
            flushList(); flushQuote(); flushTable(); flushPara();
            blocks.push({ type: 'hr' });
            return;
        }

        const ordered = line.match(/^\d+\.\s+(.*)/);
        if (ordered) {
            flushQuote(); flushTable(); flushPara();
            if (!listBuffer || listBuffer.type !== 'ol') { flushList(); listBuffer = { type: 'ol', items: [] }; }
            listBuffer.items.push(ordered[1]);
            return;
        }

        const bulleted = line.match(/^[-*]\s+(.*)/);
        if (bulleted) {
            flushQuote(); flushTable(); flushPara();
            if (!listBuffer || listBuffer.type !== 'ul') { flushList(); listBuffer = { type: 'ul', items: [] }; }
            listBuffer.items.push(bulleted[1]);
            return;
        }

        const quoted = line.match(/^>\s?(.*)/);
        if (quoted) {
            flushList(); flushTable(); flushPara();
            if (!quoteBuffer) quoteBuffer = [];
            quoteBuffer.push(quoted[1]);
            return;
        }

        // Table row: starts and ends with | and has content between pipes
        const isTableRow = /^\|.*\|$/.test(line);
        if (isTableRow) {
            const cells = line.slice(1, -1).split('|').map((c) => c.trim());

            // Separator row like |---|---|---| or |:---|:---:| just confirms
            // the previous row was a header — don't add it as data.
            const isSeparator = cells.every((c) => /^:?-{2,}:?$/.test(c));
            if (isSeparator) return;

            flushList(); flushQuote(); flushPara();
            if (!tableBuffer) {
                tableBuffer = { header: cells, rows: [] };
            } else {
                tableBuffer.rows.push(cells);
            }
            return;
        }

        flushList(); flushQuote(); flushTable();
        paraBuffer.push(line);
    });
    flushList(); flushQuote(); flushTable(); flushPara();

    return (
        <div style={style} className={className}>
            {blocks.map((block, i) => {
                const key = `b${i}`;
                if (block.type === 'hr') {
                    return <hr key={key} style={{ border: 'none', borderTop: '1px solid var(--clr-border)', margin: '10px 0' }} />;
                }
                if (block.type === 'blockquote') {
                    return (
                        <blockquote key={key} style={{
                            margin: '8px 0', padding: '8px 14px', borderLeft: '3px solid var(--clr-primary)',
                            background: 'rgba(99,102,241,0.06)', borderRadius: '0 6px 6px 0',
                            color: 'var(--clr-text-muted)', fontSize: 13.5,
                        }}>
                            {block.lines.map((l, li) => <p key={li} style={{ margin: 0 }}>{renderInline(l, `${key}-${li}`)}</p>)}
                        </blockquote>
                    );
                }
                if (block.type === 'table') {
                    return (
                        <div key={key} style={{ overflowX: 'auto', margin: '10px 0', borderRadius: 8, border: '1px solid var(--clr-border)' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        {block.header.map((h, hi) => (
                                            <th key={hi} style={{
                                                textAlign: 'left', padding: '8px 12px', fontWeight: 700,
                                                background: 'var(--clr-surface2)', borderBottom: '1px solid var(--clr-border)',
                                                borderRight: hi < block.header.length - 1 ? '1px solid var(--clr-border)' : 'none',
                                                color: 'var(--clr-text)', whiteSpace: 'nowrap',
                                            }}>
                                                {renderInline(h, `${key}-h${hi}`)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {block.rows.map((row, ri) => (
                                        <tr key={ri} style={{ background: ri % 2 === 1 ? 'var(--clr-surface2)' : 'transparent' }}>
                                            {row.map((cell, ci) => (
                                                <td key={ci} style={{
                                                    padding: '8px 12px',
                                                    borderTop: '1px solid var(--clr-border)',
                                                    borderRight: ci < row.length - 1 ? '1px solid var(--clr-border)' : 'none',
                                                    color: 'var(--clr-text)', verticalAlign: 'top', lineHeight: 1.5,
                                                }}>
                                                    {renderInline(cell, `${key}-${ri}-${ci}`)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                if (block.type.startsWith('h')) {
                    const level = parseInt(block.type[1], 10);
                    const sizes = { 1: 18, 2: 16.5, 3: 15, 4: 14 };
                    return (
                        <div key={key} style={{
                            fontSize: sizes[level] || 14, fontWeight: 700, color: 'var(--clr-text)',
                            margin: i === 0 ? '0 0 8px' : '14px 0 8px',
                        }}>
                            {renderInline(block.text, key)}
                        </div>
                    );
                }
                if (block.type === 'ol' || block.type === 'ul') {
                    const Tag = block.type;
                    return (
                        <Tag key={key} style={{ margin: '4px 0 10px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {block.items.map((item, j) => (
                                <li key={`${key}-${j}`} style={{ lineHeight: 1.65 }}>{renderInline(item, `${key}-${j}`)}</li>
                            ))}
                        </Tag>
                    );
                }
                // paragraph
                return (
                    <p key={key} style={{ margin: i === 0 ? '0 0 8px' : '0 0 10px', lineHeight: 1.7 }}>
                        {renderInline(block.text, key)}
                    </p>
                );
            })}
        </div>
    );
}