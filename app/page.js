"use client"; 
import "./styles/page.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Custom Alert Component
const CustomAlert = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;
  
  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert">
        <div className="custom-alert-content">
          <p>{message}</p>
          <button className="custom-alert-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setAlertMessage("Please enter a YouTube playlist link.");
      setShowAlert(true);
      return;
    }
    if (!playlistUrl.includes("list=")) {
      setAlertMessage("Please enter a valid YouTube playlist link.");
      setShowAlert(true);
      return;
    }
    router.push(`/playlist?url=${encodeURIComponent(playlistUrl)}`);
  };

  const closeAlert = () => {
    setShowAlert(false);
    document.querySelector('.search-input').focus();
  };

  const redirectLinkedin = () => {
    window.open("https://linkedin.com/in/pawankamat")
  }

  const redirectGithub = () => {
    window.open("https://github.com/keepupwithpawan")
  }

  return (
    <>
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

        <main>
          <h1>YOUTUBE PLAYLIST <br /> ANALYZER</h1>
          <div className="tagline">
            Get insights on your favorite YouTube playlists in seconds.<br />
            Enter link below.
          </div>
          <div className="action-container">
            <input
              type="text"
              className="search-input"
              placeholder="Paste YouTube playlist URL..."
              required
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
            />
            <button type="submit" className="search-button" onClick={handleSubmit}>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </main>

        <footer>
          <p>MADE WITH ❤️ BY PAWAN</p>
        </footer>
      </div>
      
      {/* Custom Alert Component */}
      <CustomAlert 
        message={alertMessage} 
        isVisible={showAlert} 
        onClose={closeAlert} 
      />
    </>
  );
}
