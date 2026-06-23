import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ExternalLink, Clock, TrendingUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface NewsItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  source: string;
}

interface NewsPageProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 12;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Multiple free RSS feeds for more content
const RSS_FEEDS = [
  { url: 'http://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business' },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', source: 'WSJ Markets' },
  { url: 'https://www.ft.com/rss/home', source: 'Financial Times' },
];

export default function NewsPage({ onBack }: NewsPageProps) {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch from multiple RSS feeds concurrently
      const results = await Promise.allSettled(
        RSS_FEEDS.map(feed =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
            .then(r => r.json())
            .then(data => {
              if (data.status === 'ok') {
                return (data.items || []).map((item: NewsItem) => ({
                  ...item,
                  source: feed.source,
                }));
              }
              return [];
            })
            .catch(() => [])
        )
      );

      // Merge all results
      const combined: NewsItem[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          combined.push(...result.value);
        }
      }

      if (combined.length === 0) throw new Error('No articles found');

      // Sort by date descending
      combined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      // Deduplicate by title
      const seen = new Set<string>();
      const deduped = combined.filter(item => {
        const key = item.title.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAllNews(deduped);
      setLastUpdated(new Date());
      if (!isRefresh) setCurrentPage(1);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Could not load latest news. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + auto-refresh interval
  useEffect(() => {
    fetchNews();
    const timer = setInterval(() => fetchNews(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNews]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = allNews.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-surface)', fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{
        padding: '20px 40px',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--c-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', fontSize: 15,
            fontWeight: 600, color: 'var(--c-muted)', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-emerald)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-muted)')}
        >
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchNews(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--c-border)',
              background: 'var(--c-surface-alt)',
              color: 'var(--c-text)', fontSize: 13,
              fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              opacity: refreshing ? 0.6 : 1,
            }}
            onMouseEnter={e => !refreshing && (e.currentTarget.style.borderColor = 'var(--c-emerald)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content */}
      <section style={{ padding: '48px 24px 80px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Title */}
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <TrendingUp size={36} color="var(--c-emerald)" />
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Latest Financial News
              </h1>
              <p style={{ fontSize: 15, color: 'var(--c-muted)', margin: 0 }}>
                Live updates from BBC Business · Refreshes every 5 minutes
              </p>
            </div>
          </div>
          {!loading && allNews.length > 0 && (
            <div style={{ fontSize: 14, color: 'var(--c-muted)', alignSelf: 'flex-end' }}>
              {allNews.length} articles · Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                height: 360, borderRadius: 16,
                background: 'var(--c-surface-alt)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: 'var(--c-danger)', marginBottom: 16, fontSize: 16 }}>{error}</p>
            <button onClick={() => fetchNews()} style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid var(--c-border)',
              background: 'var(--c-surface-alt)', color: 'var(--c-text)',
              fontWeight: 600, cursor: 'pointer',
            }}>Try Again</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
              {currentItems.map((item, i) => (
                <a
                  key={`${item.guid}-${i}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  className="news-card-link"
                >
                  <article style={{
                    display: 'flex', flexDirection: 'column',
                    background: 'var(--c-surface-alt)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 16, overflow: 'hidden',
                    height: '100%',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                    className="news-card"
                  >
                    {/* Thumbnail */}
                    <div style={{ height: 190, overflow: 'hidden', position: 'relative', background: 'var(--c-border)', flexShrink: 0 }}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          className="news-thumb"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{
                          height: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'var(--c-muted)', fontSize: 13,
                        }}>
                          <TrendingUp size={32} color="var(--c-emerald)" style={{ opacity: 0.4 }} />
                        </div>
                      )}
                      {/* Source badge */}
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 20, backdropFilter: 'blur(6px)',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        {item.source}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-muted)', marginBottom: 10 }}>
                        <Clock size={13} />
                        {new Date(item.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <h3 style={{
                        fontSize: 17, fontWeight: 700, color: 'var(--c-text)',
                        margin: '0 0 auto', lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.title}
                      </h3>
                      <div style={{
                        marginTop: 18, display: 'flex', alignItems: 'center',
                        gap: 4, fontSize: 13, fontWeight: 600,
                        color: 'var(--c-emerald)', transition: 'opacity 0.2s',
                      }}
                        className="read-more-link"
                      >
                        Read article <ExternalLink size={13} />
                      </div>
                    </div>
                  </article>
                </a>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                marginTop: 56, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '9px 16px', borderRadius: 10,
                    border: '1px solid var(--c-border)',
                    background: currentPage === 1 ? 'transparent' : 'var(--c-surface-alt)',
                    color: currentPage === 1 ? 'var(--c-muted)' : 'var(--c-text)',
                    fontWeight: 600, fontSize: 14,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '9px 4px', color: 'var(--c-muted)', fontSize: 14 }}>…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        border: currentPage === page ? 'none' : '1px solid var(--c-border)',
                        background: currentPage === page ? 'var(--c-emerald)' : 'var(--c-surface-alt)',
                        color: currentPage === page ? '#fff' : 'var(--c-text)',
                        fontWeight: 700, fontSize: 14,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '9px 16px', borderRadius: 10,
                    border: '1px solid var(--c-border)',
                    background: currentPage === totalPages ? 'transparent' : 'var(--c-surface-alt)',
                    color: currentPage === totalPages ? 'var(--c-muted)' : 'var(--c-text)',
                    fontWeight: 600, fontSize: 14,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .news-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }
        [data-theme="dark"] .news-card:hover {
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        }
        .news-card:hover .news-thumb {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}
