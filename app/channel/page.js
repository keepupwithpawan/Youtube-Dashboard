"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/channel.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

function ChannelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const channelUrl = searchParams.get("url");

  const openChannel = () => {
    window.open(channelUrl, '_blank');
  }

  const [channelData, setChannelData] = useState({
    channelName: "",
    description: "",
    publishedAt: "",
    subscriberCount: 0,
    videoCount: 0,
    viewCount: 0,
    thumbnailUrl: "",
    country: "",
    latestVideos: [],
    topVideos: [], // New field for top performing videos
    videoCategories: {},
    uploadFrequency: [],
    viewsHistory: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!channelUrl) return;

    const minLoadingTime = 3000;
    const startTime = Date.now();

    const extractChannelId = (url) => {
      const regexPatterns = [
        /youtube\.com\/channel\/([^\/\?]+)/,
        /youtube\.com\/c\/([^\/\?]+)/,
        /youtube\.com\/user\/([^\/\?]+)/,
        /youtube\.com\/@([^\/\?]+)/
      ];

      for (const pattern of regexPatterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const fetchChannelDetails = async (channelIdentifier) => {
      try {
        let channelId = channelIdentifier;
        if (!channelIdentifier.startsWith("UC")) {
          const channelSearchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelIdentifier)}&type=channel&key=${API_KEY}`
          );
          const channelSearchData = await channelSearchResponse.json();
          
          if (!channelSearchData.items || channelSearchData.items.length === 0) {
            throw new Error("Channel not found.");
          }
          
          channelId = channelSearchData.items[0].id.channelId;
        }

        // Get channel details
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${API_KEY}`
        );
        const channelData = await channelResponse.json();

        if (!channelData.items || channelData.items.length === 0) {
          throw new Error("Channel not found.");
        }

        const channel = channelData.items[0];
        const snippet = channel.snippet;
        const statistics = channel.statistics;
        const contentDetails = channel.contentDetails;
        const uploadsPlaylistId = contentDetails.relatedPlaylists.uploads;

        const publishDateTime = new Date(snippet.publishedAt);
        const formattedPublishDate = publishDateTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });

        // Get latest videos
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=8&key=${API_KEY}`
        );
        const videosData = await videosResponse.json();
        
        if (!videosData.items || videosData.items.length === 0) {
          throw new Error("No videos found for this channel.");
        }

        const videoIds = videosData.items.map(item => item.contentDetails.videoId);
        
        const videoDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`
        );
        const videoDetailsData = await videoDetailsResponse.json();

        const latestVideos = videoDetailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          publishedAt: new Date(video.snippet.publishedAt),
          viewCount: parseInt(video.statistics.viewCount) || 0,
          likeCount: parseInt(video.statistics.likeCount) || 0,
          commentCount: parseInt(video.statistics.commentCount) || 0,
          duration: video.contentDetails.duration,
          thumbnailUrl: video.snippet.thumbnails.medium?.url || "",
          categoryId: video.snippet.categoryId
        })).sort((a, b) => b.publishedAt - a.publishedAt);

        // Get top 5 most popular videos
        const topVideosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=viewCount&type=video&key=${API_KEY}`
        );
        const topVideosData = await topVideosResponse.json();

        const topVideoIds = topVideosData.items.map(item => item.id.videoId);
        const topVideoDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${topVideoIds.join(',')}&key=${API_KEY}`
        );
        const topVideoDetailsData = await topVideoDetailsResponse.json();

        const topVideos = topVideoDetailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          viewCount: parseInt(video.statistics.viewCount) || 0,
          thumbnailUrl: video.snippet.thumbnails.medium?.url || ""
        }));

        // Get category names
        const uniqueCategoryIds = [...new Set(latestVideos.map(video => video.categoryId))];
        const categoryResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${uniqueCategoryIds.join(',')}&key=${API_KEY}`
        );
        const categoryData = await categoryResponse.json();
        
        const categoryMap = {};
        categoryData.items.forEach(category => {
          categoryMap[category.id] = category.snippet.title;
        });

        const videoCategories = {};
        latestVideos.forEach(video => {
          const categoryName = categoryMap[video.categoryId] || "Uncategorized";
          videoCategories[categoryName] = (videoCategories[categoryName] || 0) + 1;
        });

        const sortedVideos = [...latestVideos].sort((a, b) => a.publishedAt - b.publishedAt);
        const uploadFrequency = [];
        
        for (let i = 1; i < Math.min(sortedVideos.length, 30); i++) {
          const daysBetween = Math.floor((sortedVideos[i].publishedAt - sortedVideos[i-1].publishedAt) / (1000 * 60 * 60 * 24));
          uploadFrequency.push(daysBetween);
        }

        const viewsHistory = sortedVideos.map(video => ({
          date: video.publishedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          }),
          views: video.viewCount
        }));

        setChannelData({
          channelName: snippet.title,
          description: snippet.description,
          publishedAt: formattedPublishDate,
          subscriberCount: parseInt(statistics.subscriberCount) || 0,
          videoCount: parseInt(statistics.videoCount) || 0,
          viewCount: parseInt(statistics.viewCount) || 0,
          thumbnailUrl: snippet.thumbnails.default?.url || "",
          country: snippet.country || "Unknown",
          latestVideos,
          topVideos, // Add top videos to state
          videoCategories,
          uploadFrequency,
          viewsHistory: viewsHistory.slice(-20),
        });
      } catch (err) {
        setError(err.message || "Failed to fetch channel details.");
      } finally {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          setTimeout(() => setLoading(false), minLoadingTime - elapsedTime);
        } else {
          setLoading(false);
        }
      }
    };

    const channelId = extractChannelId(channelUrl);
    if (channelId) {
      fetchChannelDetails(channelId);
    } else {
      setTimeout(() => {
        setError("Invalid channel link.");
        setLoading(false);
      }, minLoadingTime);
    }
  }, [channelUrl]);

  const avgViews = channelData.videoCount > 0 ? channelData.viewCount / channelData.videoCount : 0;
  const avgUploadFrequency = channelData.uploadFrequency.length > 0 
    ? channelData.uploadFrequency.reduce((a, b) => a + b, 0) / channelData.uploadFrequency.length 
    : 0;

  const barData = {
    labels: channelData.topVideos.map(video => video.title.substring(0, 20) + "..."),
    datasets: [{
      label: "Views",
      data: channelData.topVideos.map(video => video.viewCount),
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
        const videoId = channelData.topVideos[index].id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(videoUrl, '_blank');
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    }
  };

  const categoryLabels = Object.keys(channelData.videoCategories);
  const categoryData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryLabels.map(category => channelData.videoCategories[category]),
      backgroundColor: [
        'rgba(3, 13, 195, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)',
      ],
      borderColor: [
        'rgba(3, 13, 195, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 99, 132, 1)',
      ],
      borderWidth: 1,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  const lineData = {
    labels: channelData.viewsHistory.map(item => item.date),
    datasets: [{
      label: "Views",
      data: channelData.viewsHistory.map(item => item.views),
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

  const SkeletonLoader = () => {
    return (
      <>
        <div className="channel-header skeleton">
          <div className="header-content">
            <div className="channel-title skeleton-text"></div>
            <div className="channel-stats skeleton-text"></div>
          </div>
          <div className="channel-thumbnail-container skeleton-thumbnail"></div>
        </div>
  
        <div className="bento-grid">
          <div className="bento-item subscribers skeleton">
            {/* <div className="bento-icon skeleton-icon"></div> */}
            <div className="stat-title skeleton-text"></div>
            <div className="stat-value skeleton-text"></div>
          </div>
  
          <div className="bento-item videos skeleton">
            {/* <div className="bento-icon skeleton-icon"></div> */}
            <div className="stat-title skeleton-text"></div>
            <div className="stat-value skeleton-text"></div>
          </div>
  
          <div className="bento-item views skeleton">
            {/* <div className="bento-icon skeleton-icon"></div> */}
            <div className="stat-title skeleton-text"></div>
            <div className="stat-value skeleton-text"></div>
          </div>
  
          <div className="bento-item frequency skeleton">
            {/* <div className="bento-icon skeleton-icon"></div> */}
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
        </div>
  
        <div className="latest-videos skeleton">
          <div className="stat-title skeleton-text"></div>
          <div className="latest-videos-list">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="latest-video-item">
                <div className="video-thumbnail skeleton-thumbnail"></div>
                <div className="video-info">
                  <div className="video-title skeleton-text"></div>
                  <div className="video-stats skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const redirectLinkedin = () => {
    window.open("https://linkedin.com/in/pawankamat");
  };

  const redirectGithub = () => {
    window.open("https://github.com/keepupwithpawan");
  };

  const formatNumber = (num) => {
    return num > 1000000
      ? `${(num / 1000000).toFixed(1)}M`
      : num > 1000
      ? `${(num / 1000).toFixed(1)}K`
      : num;
  };

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

      <main className="channel-main">
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
            <div className="channel-header">
              <div className="header-content">
                <div className="channel-title">{channelData.channelName}</div>
                <div className="channel-stats">
                  <div className="channel-publish-date">Started on {channelData.publishedAt}</div>
                  {channelData.country !== "Unknown" && (
                    <div className="channel-country">From {channelData.country}</div>
                  )}
                </div>
              </div>
              {channelData.thumbnailUrl && (
                <div className="channel-thumbnail-container" style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={channelData.thumbnailUrl} alt="Channel thumbnail" className="channel-thumbnail" onClick={openChannel} />
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
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bento-grid">
              <div className="bento-item subscribers">
                <div className="bento-icon"><i className="fa-solid fa-users"></i></div>
                <div className="stat-title">Subscribers</div>
                <div className="stat-value">{formatNumber(channelData.subscriberCount)}</div>
              </div>

              <div className="bento-item videos">
                <div className="bento-icon"><i className="fa-solid fa-film"></i></div>
                <div className="stat-title">Videos</div>
                <div className="stat-value">{formatNumber(channelData.videoCount)}</div>
              </div>

              <div className="bento-item views">
                <div className="bento-icon"><i className="fa-solid fa-eye"></i></div>
                <div className="stat-title">Total Views</div>
                <div className="stat-value">{formatNumber(channelData.viewCount)}</div>
              </div>

              <div className="bento-item frequency">
                <div className="bento-icon"><i className="fa-solid fa-calendar-days"></i></div>
                <div className="stat-title">Upload Frequency</div>
                <div className="stat-value">{avgUploadFrequency > 0 ? `${avgUploadFrequency.toFixed(1)} days` : "N/A"}</div>
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
                <div className="stat-title">Recent Videos View Trend</div>
                <div className="chart-container">
                  <Line data={lineData} options={lineOptions} />
                </div>
              </div>
            </div>

            <div className="latest-videos">
              <div className="stat-title">Latest Videos</div>
              <div className="latest-videos-list">
                {channelData.latestVideos.map((video, index) => (
                  <div key={index} className="latest-video-item" onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}>
                    <div className="video-thumbnail">
                      <img src={video.thumbnailUrl} alt={video.title} />
                    </div>
                    <div className="video-info">
                      <div className="video-title">{video.title}</div>
                      <div className="video-stats">
                        <span><i className="fa-solid fa-eye"></i> {formatNumber(video.viewCount)}</span>
                        <span><i className="fa-solid fa-thumbs-up"></i> {formatNumber(video.likeCount)}</span>
                        <span><i className="fa-solid fa-calendar"></i> {new Date(video.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
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

export default function ChannelDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChannelContent />
    </Suspense>
  );
}