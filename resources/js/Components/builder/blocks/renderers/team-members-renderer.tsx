import type { BlockRendererProps } from '../block-registry';

interface Social {
    linkedin?: string;
    twitter?: string;
    email?: string;
}

interface Member {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    social?: Social;
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            style={{
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #6366f1)15',
                color: 'var(--color-primary, #6366f1)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary, #6366f1)30';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary, #6366f1)15';
                (e.currentTarget as HTMLElement).style.transform = '';
            }}
        >
            {children}
        </a>
    );
}

function renderSocial(social?: Social) {
    if (!social) return null;
    const links: { href: string; label: string; icon: string }[] = [];
    if (social.linkedin) links.push({ href: social.linkedin, label: 'LinkedIn', icon: 'in' });
    if (social.twitter) links.push({ href: social.twitter, label: 'Twitter', icon: '𝕏' });
    if (social.email) links.push({ href: `mailto:${social.email}`, label: 'Email', icon: '@' });
    if (links.length === 0) return null;

    return (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
            {links.map((link) => (
                <SocialLink key={link.label} href={link.href} label={link.label}>
                    {link.icon}
                </SocialLink>
            ))}
        </div>
    );
}

function Avatar({ src, name, size = 80 }: { src?: string; name: string; size?: number }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            />
        );
    }
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary, #6366f1), var(--color-secondary, #8b5cf6))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: size * 0.35,
        }}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function TeamMembersRenderer({ block }: BlockRendererProps) {
    const members = (block.props.members as Member[]) || [];
    const columns = (block.props.columns as number) || 3;
    const style = (block.props.style as string) || 'card';

    const gridCols: Record<number, string> = {
        2: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        3: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        4: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    };

    if (members.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--color-text-muted, #94a3b8)',
                border: '2px dashed var(--color-border, rgba(100,116,139,0.2))',
                borderRadius: 'var(--border-radius, 0.5rem)',
            }}>
                Aucun membre ajouté
            </div>
        );
    }

    if (style === 'minimal') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[3], gap: '1rem' }}>
                {members.map((member, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', borderRadius: 'var(--border-radius, 0.5rem)' }}>
                        <Avatar src={member.avatar} name={member.name} size={48} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text, inherit)' }}>{member.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary, #6366f1)', opacity: 0.8 }}>{member.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (style === 'circle') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[3], gap: '2rem' }}>
                {members.map((member, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '1rem' }}>
                            {/* Decorative ring */}
                            <div style={{
                                position: 'absolute',
                                inset: '-4px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary, #6366f1), var(--color-secondary, #8b5cf6))',
                                opacity: 0.3,
                            }} />
                            <div style={{ position: 'relative', borderRadius: '50%', overflow: 'hidden' }}>
                                <Avatar src={member.avatar} name={member.name} size={112} />
                            </div>
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-heading, inherit)', fontWeight: 600, fontSize: '1rem', color: 'var(--color-text, inherit)', margin: '0 0 0.25rem' }}>
                            {member.name}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-primary, #6366f1)', fontWeight: 500, margin: 0 }}>{member.role}</p>
                        {member.bio && (
                            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem', lineHeight: 1.5, color: 'var(--color-text, inherit)' }}>{member.bio}</p>
                        )}
                        {renderSocial(member.social)}
                    </div>
                ))}
            </div>
        );
    }

    // card (default)
    return (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols[columns] || gridCols[3], gap: '1.25rem' }}>
            {members.map((member, i) => (
                <div
                    key={i}
                    style={{
                        backgroundColor: 'var(--color-surface, rgba(255,255,255,0.03))',
                        border: '1px solid var(--color-border, rgba(255,255,255,0.07))',
                        borderRadius: 'var(--border-radius, 0.875rem)',
                        padding: '1.75rem 1.5rem',
                        textAlign: 'center',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = '';
                        (e.currentTarget as HTMLElement).style.boxShadow = '';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Avatar src={member.avatar} name={member.name} size={72} />
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-heading, inherit)', fontWeight: 600, fontSize: '1rem', color: 'var(--color-text, inherit)', margin: '0 0 0.25rem' }}>
                        {member.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-primary, #6366f1)', margin: '0 0 0.625rem' }}>
                        {member.role}
                    </p>
                    {member.bio && (
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.55, opacity: 0.6, margin: 0, color: 'var(--color-text, inherit)' }}>{member.bio}</p>
                    )}
                    {renderSocial(member.social)}
                </div>
            ))}
        </div>
    );
}
