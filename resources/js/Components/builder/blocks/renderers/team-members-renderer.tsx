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

export default function TeamMembersRenderer({ block }: BlockRendererProps) {
    const members = (block.props.members as Member[]) || [];
    const columns = (block.props.columns as number) || 3;
    const style = (block.props.style as string) || 'card';

    const gridCols: Record<number, string> = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    if (members.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun membre ajouté</p>
                <p className="text-xs mt-1">Ajoutez des membres dans les paramètres du bloc</p>
            </div>
        );
    }

    const renderSocial = (social?: Social) => {
        if (!social) return null;
        const links = [];
        if (social.linkedin) links.push({ href: social.linkedin, label: 'LinkedIn', icon: 'in' });
        if (social.twitter) links.push({ href: social.twitter, label: 'Twitter', icon: '𝕏' });
        if (social.email) links.push({ href: `mailto:${social.email}`, label: 'Email', icon: '@' });
        if (links.length === 0) return null;

        return (
            <div className="flex gap-2 mt-3 justify-center">
                {links.map((link) => (
                    <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold"
                        title={link.label}
                    >
                        {link.icon}
                    </a>
                ))}
            </div>
        );
    };

    if (style === 'circle') {
        return (
            <div className={`grid ${gridCols[columns] || gridCols[3]} gap-8`}>
                {members.map((member, i) => (
                    <div key={i} className="text-center">
                        <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                                    {member.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h4 className="font-semibold text-gray-800">{member.name}</h4>
                        <p className="text-sm text-blue-600">{member.role}</p>
                        {member.bio && <p className="text-sm text-gray-500 mt-2">{member.bio}</p>}
                        {renderSocial(member.social)}
                    </div>
                ))}
            </div>
        );
    }

    if (style === 'minimal') {
        return (
            <div className={`grid ${gridCols[columns] || gridCols[3]} gap-6`}>
                {members.map((member, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                    {member.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{member.name}</h4>
                            <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // card style (default)
    return (
        <div className={`grid ${gridCols[columns] || gridCols[3]} gap-6`}>
            {members.map((member, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                                {member.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h4 className="font-semibold text-gray-800">{member.name}</h4>
                    <p className="text-sm text-blue-600 mb-2">{member.role}</p>
                    {member.bio && <p className="text-sm text-gray-500">{member.bio}</p>}
                    {renderSocial(member.social)}
                </div>
            ))}
        </div>
    );
}
