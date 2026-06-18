import feedparser

url = "https://news.ycombinator.com/rss"
feed = feedparser.parse(url)

for item in feed.entries:
    print(item.title)
    print(item.link)
    print(item.description)
    print(item.published)