"use client"; 
import "../styles/channel-landing.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [channelURL, setChannelURL] = useState(""); // Fixed case consistency
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check for valid YouTube channel URL patterns
    if (
      !channelURL.includes("youtube.com/@") && 
      !channelURL.includes("youtube.com/channel/")
    ) {
      alert("Please enter a valid YouTube channel link (e.g., https://www.youtube.com/@username or https://www.youtube.com/channel/ID).");
      return;
    }
    // Redirect to a channel analysis page with the URL as a query parameter
    router.push(`/channel?url=${encodeURIComponent(channelURL)}`);
  };

  const handlePlaylistPage = (e) => {
    e.preventDefault();
    // Redirect to playlist analysis page
    router.push(`/`); // Assuming '/' is the playlist landing page; adjust if different
  };

  const redirectLinkedin = () => {
    window.open("https://linkedin.com/in/pawankamat", "_blank");
  };

  const redirectGithub = () => {
    window.open("https://github.com/keepupwithpawan", "_blank");
  };

  return (
    <>
      <div className="container">
        <header>
          <div className="logo">
            <span className="logo-icon">⟹</span>
          </div>
          <nav>
            <div className="nav-links">
              <div className="nav-item" onClick={redirectLinkedin}>
                <i className="fa-brands fa-linkedin"></i>
              </div>
              <div className="nav-item" onClick={redirectGithub}>
                <i className="fa-brands fa-github"></i>
              </div>
            </div>
          </nav>
        </header>

        <main>
          <h1>YOUTUBE CHANNEL <br /> ANALYZER</h1>
          <div className="tagline">
            Get insights on your favorite YouTube Channels in seconds.<br />
            Enter link below.
          </div>
          <div className="action-container">
            <input
              type="text"
              className="search-input"
              placeholder="Paste YouTube channel URL..."
              required
              value={channelURL}
              onChange={(e) => setChannelURL(e.target.value)} // Fixed case consistency
            />
            <button type="submit" className="search-button" onClick={handleSubmit}>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="other-features">
            {/* Adjusted button text and logic */}
            <button className="feature-1" onClick={handlePlaylistPage}>
              Analyze Playlist Instead
            </button>
          </div>
        </main>

        <footer>
          <p>MADE WITH ❤️ BY PAWAN</p>
        </footer>
      </div>
    </>
  );
}