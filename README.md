# YouTube Dashboard

A modern, interactive dashboard for analyzing YouTube playlists and channels. Built with Next.js and Chart.js.

## Features

- 📊 Real-time playlist and channel analytics  
- 📈 Interactive charts and graphs  
- 🎯 Top video performance tracking (channel-wide)  
- 📅 Recent video view trends  
- 🏷️ Video category distribution analysis  
- 🎥 Latest videos grid view  
- 👥 Subscriber, video, and view count metrics  
- ⏱️ Upload frequency analysis  
- 📱 Responsive design  
- ⚡ Fast loading with skeleton screens  

## Tech Stack

- **Next.js 14**  
- **React**  
- **Chart.js**  
- **CSS3**  
- **YouTube Data API**  

## Getting Started

### 1. Clone the Repository  
\`\`\`bash
git clone https://github.com/yourusername/youtube-dashboard.git
cd youtube-dashboard
\`\`\`

### 2. Install Dependencies  
\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables  
Create a \`.env\` file in the root directory and add your YouTube API key:  

\`\`\`plaintext
NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
\`\`\`

### 4. Run the Development Server  
\`\`\`bash
npm run dev
\`\`\`

### 5. Open in Your Browser  
Visit [http://localhost:3000](http://localhost:3000) to see the dashboard in action.  

---

## How to Use  

### **1. Enter a URL:**  
Input a YouTube channel URL (e.g., \`youtube.com/@username\`, \`youtube.com/channel/ID\`, etc.) or playlist URL in the provided field.  

### **2. Analyze:**  
Wait for the dashboard to fetch and analyze the channel or playlist data.  

### **3. Explore Metrics and Visualizations:**  

#### **Channel Overview:**  
View **subscriber count, total videos, and total views**.  

#### **Top 5 Most Popular Videos:**  
See the channel's all-time top-performing videos in an interactive bar chart.  

#### **Recent Video View Trends:**  
Track view counts of recent videos in a **line chart**.  

#### **Video Category Distribution:**  
Analyze category breakdown in a **doughnut chart** (for channels).  

#### **Latest Videos Grid:**  
Browse a grid of the channel's most recent videos with **view, like, and date stats**.  

### **4. Interact:**  

- Click the **channel thumbnail** to open it on YouTube.  
- Click **video bars** in the **Top 5 chart** or **items in the Latest Videos grid** to watch them on YouTube.  
- Hover over charts for detailed tooltips.  

---

## Environment Variables  

| Variable | Description |  
|----------|------------|  
| \`NEXT_PUBLIC_YOUTUBE_API_KEY\` | Your YouTube Data API key, obtainable from the Google Cloud Console. |  

---

## Contributing  

Contributions are welcome! To contribute:  

1. **Fork the repository.**  
2. **Create a new branch:**  
   \`\`\`bash
   git checkout -b feature/your-feature
   \`\`\`
3. **Make your changes and commit:**  
   \`\`\`bash
   git commit -m "Add your feature"
   \`\`\`
4. **Push to your branch:**  
   \`\`\`bash
   git push origin feature/your-feature
   \`\`\`
5. **Open a Pull Request.**  

Please ensure your code follows the project's style and includes appropriate tests if applicable.  

---

## License  

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.  

---

## Author  

**Pawan**  

---

## Acknowledgments  

- **YouTube Data API** for providing the data backbone.  
- **Chart.js** for beautiful, interactive charts.  
- **Next.js** team for an amazing framework.  
"""
