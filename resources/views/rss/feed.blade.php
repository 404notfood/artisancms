{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>{{ htmlspecialchars($title, ENT_XML1, 'UTF-8') }}</title>
        <description>{{ htmlspecialchars($description, ENT_XML1, 'UTF-8') }}</description>
        <link>{{ $siteUrl }}</link>
        <language>{{ $language }}</language>
        <lastBuildDate>{{ $lastBuildDate }}</lastBuildDate>
        <atom:link href="{{ url()->current() }}" rel="self" type="application/rss+xml" />
        <generator>ArtisanCMS</generator>
@foreach($items as $item)
        <item>
            <title>{{ htmlspecialchars($item['title'], ENT_XML1, 'UTF-8') }}</title>
            <link>{{ $item['link'] }}</link>
            <description><![CDATA[{!! $item['description'] !!}]]></description>
            <content:encoded><![CDATA[{!! $item['contentEncoded'] !!}]]></content:encoded>
            <dc:creator>{{ htmlspecialchars($item['creator'], ENT_XML1, 'UTF-8') }}</dc:creator>
            <pubDate>{{ $item['pubDate'] }}</pubDate>
            <guid isPermaLink="true">{{ $item['guid'] }}</guid>
        </item>
@endforeach
    </channel>
</rss>
