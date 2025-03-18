import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500&f[]=zodiak@800&f[]=gambarino@400&f[]=sentient@400&f[]=melodrama@400&f[]=dancing-script@700&f[]=satoshi@300,400&f[]=general-sans@400&f[]=switzer@300&f[]=pencerio@50&f[]=bonny@400&f[]=aktura@400&f[]=britney@400&f[]=rowan@400&f[]=bespoke-serif@400&display=swap" rel="stylesheet"></link>
      <script src="https://kit.fontawesome.com/4b1022cf8e.js" crossorigin="anonymous"></script>
      <body>
        {children}
      </body>
    </html>
  );
}
