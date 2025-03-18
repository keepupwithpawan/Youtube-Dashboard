"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/playlist.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// Create a separate client component for the main content
function PlaylistContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playlistUrl = searchParams.get("url");

  const openPlaylist = () => {
    window.open(playlistUrl, '_blank');
  }

  const [realData, setRealData] = useState({
    playlistName: "",
    channelName: "",
    description: "",
    publishedAt: "",
    publishTime: "",
    thumbnailUrl: "",
    videoCount: 0,
    totalViews: 0,
    categories: [],
    videos: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playlistUrl) return;

    const minLoadingTime = 3000;
    const startTime = Date.now();

    const extractPlaylistId = (url) => {
      const match = url.match(/[?&]list=([^&]+)/);
      return match ? match[1] : null;
    };

    const fetchPlaylistDetails = async (playlistId) => {
      try {
        const playlistResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`
        );
        const playlistData = await playlistResponse.json();

        if (!playlistData.items || playlistData.items.length === 0) {
          throw new Error("Playlist not found.");
        }

        const playlist = playlistData.items[0];
        const snippet = playlist.snippet;
        const publishDateTime = new Date(snippet.publishedAt);
        const formattedPublishDate = publishDateTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
        const formattedPublishTime = publishDateTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        let videoIds = [];
        let nextPageToken = "";
        do {
          const playlistItemsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`
          );
          const playlistItemsData = await playlistItemsResponse.json();
          videoIds = videoIds.concat(
            playlistItemsData.items.map(item => ({
              id: item.contentDetails.videoId,
              publishedAt: item.snippet.publishedAt,
              title: item.snippet.title
            }))
          );
          nextPageToken = playlistItemsData.nextPageToken || "";
        } while (nextPageToken);

        const videoDetails = [];
        for (let i = 0; i < videoIds.length; i += 50) {
          const batch = videoIds.slice(i, i + 50).map(v => v.id);
          const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,topicDetails&id=${batch.join(',')}&key=${API_KEY}`
          );
          const videosData = await videosResponse.json();
          videoDetails.push(...videosData.items.map((item, index) => ({
            ...item,
            publishedAt: videoIds[i + index].publishedAt,
            title: videoIds[i + index].title
          })));
        }

        const totalViews = videoDetails.reduce((sum, video) => {
          return sum + (parseInt(video.statistics.viewCount) || 0);
        }, 0);

        const categories = [...new Set(
          videoDetails
            .filter(video => video.topicDetails?.topicCategories)
            .flatMap(video => video.topicDetails.topicCategories.map(cat => cat.split('/').pop()))
        )].slice(0, 3);

        const sortedVideos = videoDetails.sort((a, b) =>
          new Date(a.publishedAt) - new Date(b.publishedAt)
        );

        setRealData({
          playlistName: snippet.title,
          channelName: snippet.channelTitle,
          description: snippet.description,
          publishedAt: formattedPublishDate,
          publishTime: formattedPublishTime,
          thumbnailUrl: snippet.thumbnails.standard?.url || snippet.thumbnails.high?.url || "",
          videoCount: playlist.contentDetails?.itemCount || 0,
          totalViews,
          categories: categories.length > 0 ? categories : ["General"],
          videos: sortedVideos,
        });
      } catch (err) {
        setError(err.message || "Failed to fetch playlist details.");
      } finally {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsedTime);
        } else {
          setLoading(false);
        }
      }
    };

    const playlistId = extractPlaylistId(playlistUrl);
    if (playlistId) {
      fetchPlaylistDetails(playlistId);
    } else {
      setTimeout(() => {
        setError("Invalid playlist link.");
        setLoading(false);
      }, minLoadingTime);
    }
  }, [playlistUrl]);

  // Bar graph data for top 5 most popular videos
  const topVideos = realData.videos
    .sort((a, b) => (parseInt(b.statistics.viewCount) || 0) - (parseInt(a.statistics.viewCount) || 0))
    .slice(0, 5)
    .map(video => ({
      title: video.title,
      views: parseInt(video.statistics.viewCount) || 0,
      videoId: video.id
    }));

  const extractPlaylistId = (url) => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const barData = {
    labels: topVideos.map(video => video.title.substring(0, 20) + "..."),
    datasets: [{
      label: "Views",
      data: topVideos.map(video => video.views),
      backgroundColor: "rgba(3, 13, 195, 0.6)",
      borderColor: "rgba(3, 13, 195, 1)",
      borderWidth: 1,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value > 1000000 ? `${(value / 1000000).toFixed(1)}M` : value > 1000 ? `${(value / 1000).toFixed(1)}K` : value,
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const videoId = topVideos[index].videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}&list=${extractPlaylistId(playlistUrl)}`;
        window.open(videoUrl, '_blank');
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    }
  };

  // Line graph data for views trend
  const lineData = {
    labels: realData.videos.map((_, index) => `Video ${index + 1}`),
    datasets: [{
      label: "Views Over Time",
      data: realData.videos.map(video => parseInt(video.statistics.viewCount) || 0),
      fill: false,
      borderColor: "rgba(3, 13, 195, 1)",
      tension: 0.1,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value > 1000000 ? `${(value / 1000000).toFixed(1)}M` : value > 1000 ? `${(value / 1000).toFixed(1)}K` : value,
        },
      },
    },
  };

  const avgViews = realData.videoCount > 0 ? realData.totalViews / realData.videoCount : 0;

  // Function to render skeleton loaders
  const SkeletonLoader = () => {
    return (
      <>
        <div className="playlist-header skeleton">
          <div className="header-content">
            <div className="playlist-title skeleton-text"></div>
            <div className="playlist-channel skeleton-text"></div>
          </div>
          <div className="thumbnail-container skeleton-thumbnail"></div>
        </div>

        <div className="bento-grid">
          <div className="bento-item main-stats skeleton">
            <div className="bento-icon skeleton-icon"></div>
            <div className="stat-title skeleton-text"></div>
            <div className="stat-value skeleton-text"></div>
          </div>

          <div className="bento-item timeline skeleton">
            <div className="bento-icon skeleton-icon"></div>
            <div className="stat-title skeleton-text"></div>
            <div className="timeline-stats">
              <div className="timeline-item skeleton-text"></div>
              <div className="timeline-item skeleton-text"></div>
            </div>
          </div>

          <div className="bento-item categories skeleton">
            <div className="bento-icon skeleton-icon"></div>
            <div className="stat-title skeleton-text"></div>
            <div className="categories-list">
              <span className="category-tag skeleton-tag"></span>
              <span className="category-tag skeleton-tag"></span>
              <span className="category-tag skeleton-tag"></span>
            </div>
          </div>

          <div className="bento-item views skeleton">
            <div className="bento-icon skeleton-icon"></div>
            <div className="stat-title skeleton-text"></div>
            <div className="stat-value skeleton-text"></div>
          </div>
        </div>

        <div className="bento-grid charts-grid">
          <div className="bento-item top-videos skeleton">
            <div className="stat-title skeleton-text"></div>
            <div className="chart-container skeleton-chart"></div>
          </div>

          <div className="bento-item views-trend skeleton">
            <div className="stat-title skeleton-text"></div>
            <div className="chart-container skeleton-chart"></div>
          </div>

          <div className="bento-item avg-views skeleton">
            <div className="avg-views-content">
              <div className="stat-title skeleton-text"></div>
              <div className="stat-value skeleton-text"></div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const redirectLinkedin = () => {
    window.open("https://linkedin.com/in/pawankamat")
  }

  const redirectGithub = () => {
    window.open("https://github.com/keepupwithpawan")
  }

  return (
    <div className="container">
      <header>
        <div className="logo">
          <span className="logo-icon">⟹</span>
        </div>
        <nav>
          <div className="nav-links">
            <div className="nav-item" onClick={redirectLinkedin}><i className="fa-brands fa-linkedin"></i></div>
            <div className="nav-item" onClick={redirectGithub}><i className="fa-brands fa-github"></i></div>
          </div>
        </nav>
      </header>

      <main className="playlist-main">
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button className="back-button" onClick={() => router.push("/")}>
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="playlist-header">
              <div className="header-content">
                <div className="playlist-title">{realData.playlistName}</div>
                <div className="playlist-channel">by {realData.channelName}</div>
              </div>
              {realData.thumbnailUrl && (
                <div className="thumbnail-container" style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={realData.thumbnailUrl} alt="Playlist thumbnail" className="thumbnail" />
                  <i 
                    className="fa-solid fa-link"
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      padding: '5px',
                      borderRadius: '3px',
                      fontSize: '16px'
                    }}></i>
                </div>
              )}
            </div>

            <div className="bento-grid">
              <div className="bento-item main-stats">
                <div className="bento-icon"><i className="fa-solid fa-film"></i></div>
                <div className="stat-title">Videos</div>
                <div className="stat-value">{realData.videoCount}</div>
              </div>

              <div className="bento-item timeline">
                <div className="bento-icon"><i className="fa-solid fa-calendar"></i></div>
                <div className="stat-title">Timeline</div>
                <div className="timeline-stats">
                  <div className="timeline-item">
                    <span>Published At:</span> {realData.publishedAt}
                  </div>
                  <div className="timeline-item">
                    <span>Time:</span> {realData.publishTime}
                  </div>
                </div>
              </div>

              <div className="bento-item categories">
                <div className="bento-icon"><i className="fa-solid fa-tags"></i></div>
                <div className="stat-title">Categories</div>
                <div className="categories-list">
                  {realData.categories.map((category, index) => (
                    <span key={index} className="category-tag">{category}</span>
                  ))}
                </div>
              </div>

              <div className="bento-item views">
                <div className="bento-icon"><i className="fa-solid fa-eye"></i></div>
                <div className="stat-title">Total Views</div>
                <div className="stat-value">
                  {realData.totalViews > 1000000
                    ? `${(realData.totalViews / 1000000).toFixed(1)}M`
                    : realData.totalViews > 1000
                      ? `${(realData.totalViews / 1000).toFixed(1)}K`
                      : realData.totalViews}
                </div>
              </div>
            </div>

            <div className="bento-grid charts-grid">
              <div className="bento-item top-videos">
                <div className="stat-title">Top 5 Most Popular Videos</div>
                <div className="chart-container">
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>

              <div className="bento-item views-trend">
                <div className="stat-title">Views Trend Over Time</div>
                <div className="chart-container">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </div>

              <div className="bento-item avg-views">
                <div className="avg-views-content">
                  <div className="stat-title">Average Views per Video</div>
                  <div className="stat-value">
                    {avgViews > 1000000
                      ? `${(avgViews / 1000000).toFixed(1)}M`
                      : avgViews > 1000
                        ? `${(avgViews / 1000).toFixed(1)}K`
                        : Math.round(avgViews)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer>
        <p>MADE WITH ❤️ BY PAWAN</p>
      </footer>
    </div>
  );
}

// Main page component
export default function PlaylistDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaylistContent />
    </Suspense>
  );
}