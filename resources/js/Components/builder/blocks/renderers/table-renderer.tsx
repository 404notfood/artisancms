import type { BlockRendererProps } from '../block-registry';

export default function TableRenderer({ block }: BlockRendererProps) {
    const headers = (block.props.headers as string[]) || [];
    const rows = (block.props.rows as string[][]) || [];
    const striped = (block.props.striped as boolean) ?? true;
    const bordered = (block.props.bordered as boolean) ?? true;
    const caption = (block.props.caption as string) || '';
    const highlight = (block.props.highlightColumn as number | undefined);

    if (headers.length === 0 && rows.length === 0) {
        return (
            <div className="w-full py-8 text-center text-gray-400 border-2 border-dashed rounded">
                Tableau vide - ajoutez des colonnes et des lignes
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto" style={{ borderRadius: 'var(--border-radius, 0.75rem)', overflow: 'hidden' }}>
            <table
                className="w-full text-sm text-left"
                style={{
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    border: bordered ? '1px solid var(--color-border, #e2e8f0)' : undefined,
                    borderRadius: 'var(--border-radius, 0.75rem)',
                    overflow: 'hidden',
                }}
            >
                {caption && (
                    <caption className="text-sm mb-2 text-left" style={{ color: 'var(--color-text-muted, #64748b)' }}>{caption}</caption>
                )}
                {headers.length > 0 && (
                    <thead>
                        <tr style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    style={{
                                        padding: '0.875rem 1.25rem',
                                        fontWeight: 600,
                                        fontSize: '0.8125rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--color-text-muted, #64748b)',
                                        borderBottom: '2px solid var(--color-border, #e2e8f0)',
                                        ...(index > 0 && bordered ? { borderLeft: '1px solid var(--color-border, #e2e8f0)' } : {}),
                                        ...(highlight !== undefined && index === highlight ? {
                                            color: 'var(--color-primary, #3b82f6)',
                                            backgroundColor: 'color-mix(in srgb, var(--color-primary, #3b82f6) 5%, var(--color-surface, #f8fafc))',
                                        } : {}),
                                    }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            style={{
                                backgroundColor: striped && rowIndex % 2 === 1 ? 'var(--color-surface, #f8fafc)' : 'transparent',
                                transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--color-primary, #3b82f6) 4%, transparent)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = striped && rowIndex % 2 === 1 ? 'var(--color-surface, #f8fafc)' : 'transparent';
                            }}
                        >
                            {(row || []).map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    style={{
                                        padding: '0.875rem 1.25rem',
                                        color: cellIndex === 0 ? 'var(--color-text, #0f172a)' : 'var(--color-text-muted, #64748b)',
                                        fontWeight: cellIndex === 0 ? 500 : 400,
                                        borderBottom: rowIndex < rows.length - 1 ? '1px solid var(--color-border, #e2e8f0)' : undefined,
                                        ...(cellIndex > 0 && bordered ? { borderLeft: '1px solid var(--color-border, #e2e8f0)' } : {}),
                                        ...(highlight !== undefined && cellIndex === highlight ? {
                                            color: 'var(--color-text, #0f172a)',
                                            fontWeight: 500,
                                            backgroundColor: 'color-mix(in srgb, var(--color-primary, #3b82f6) 3%, transparent)',
                                        } : {}),
                                    }}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
