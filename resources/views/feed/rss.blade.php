{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>{{ htmlspecialchars($siteName, ENT_XML1, 'UTF-8') }}</title>
        <description>{{ htmlspecialchars($siteDescription, ENT_XML1, 'UTF-8') }}</description>
        <link>{{ $siteUrl }}</link>
        <language>{{ $language }}</language>
        <lastBuildDate>{{ $posts->first()?->published_at?->toRfc2822String() ?? now()->toRfc2822String() }}</lastBuildDate>
        <atom:link href="{{ route('feed.rss') }}" rel="self" type="application/rss+xml" />
        @foreach($posts as $post)
        <item>
            <title>{{ htmlspecialchars($post->title, ENT_XML1, 'UTF-8') }}</title>
            <link>{{ url('/blog/' . $post->slug) }}</link>
            <description>{{ htmlspecialchars($post->excerpt ?? '', ENT_XML1, 'UTF-8') }}</description>
            <pubDate>{{ $post->published_at->toRfc2822String() }}</pubDate>
            <author>{{ htmlspecialchars($post->author?->name ?? '', ENT_XML1, 'UTF-8') }}</author>
            <guid isPermaLink="true">{{ url('/blog/' . $post->slug) }}</guid>
        </item>
        @endforeach
    </channel>
</rss>
