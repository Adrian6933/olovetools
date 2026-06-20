export default {
  "title": "EXIF-Clear",
  "description": "Inspect and strip EXIF, GPS, and metadata from images locally in your browser. Protect your privacy online.",
  "btn_download_cleaned": "Download Cleaned Images",
  "btn_download_zip": "Download Cleaned (.ZIP)",
  "label_upload_box": "Drag & drop images here or click to browse",
  "label_files_loaded": "Loaded Files",
  "btn_clear_all": "Clear All",
  "label_options": "Removal Level",
  "opt_full_strip": "Full Clean (Recommended - EXIF, GPS, XMP, Comments)",
  "opt_gps_only": "GPS Location Only",
  "opt_camera_only": "Camera & Device Metadata Only",
  "label_meta_details": "Metadata Properties",
  "meta_make": "Camera Manufacturer",
  "meta_model": "Camera Model",
  "meta_datetime": "Date/Time Taken",
  "meta_gps": "GPS Location Coordinates",
  "meta_software": "Editing Software",
  "status_clean": "Clean / No Metadata",
  "status_has_meta": "Metadata Found",
  "status_has_gps": "GPS Found",
  "no_files_loaded": "No images loaded yet",
  "preview_title": "Metadata Inspector",
  "progress_clearing": "Stripping metadata from image {current} of {total}...",
  "seo_title": "EXIF-Clear | Free Online Image EXIF & GPS Metadata Stripper",
  "seo_description": "Remove EXIF, GPS, and metadata tags from JPEG/PNG images locally online. Clear location and camera data for complete privacy.",
  "seoHeroTitle": "Strip GPS and Camera EXIF Metadata Offline",
  "seoHeroText": "Protect your privacy before sharing photographs. EXIF-Clear parses and removes metadata headers locally in your browser RAM.",
  "seoHeroList": [
    "Identify GPS coords, camera makes, and exposure metadata tags",
    "Clears all meta segments including EXIF, XMP, and Photoshop IPTC blocks",
    "100% client-side memory safety - no backend servers or uploads"
  ],
  "seoBrowserSpeedTitle": "Real-Time Binary Header Filtering",
  "seoBrowserSpeedText": "By parsing raw file bytes on high-performance ArrayBuffers, we strip segments instantly, maintaining full image resolution without compression artifact degradation.",
  "seoUseCaseTitle": "Crucial for Photographers, Bloggers, and Mobile Users",
  "seoUseCaseText": "Photos taken on smartphones pack exact geographic coordinates. Strip EXIF data prior to publishing portfolios or listings.",
  "seoPrivacyTitle": "Guaranteed Local Sandboxing",
  "seoPrivacyText": "None of your source photos or graphics touch external networks. Operations occur strictly inside your sandboxed browser tab.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Why should I strip metadata from my photos?",
      "answer": "Smartphone cameras inject GPS coordinates, date stamps, and camera identifiers into image files, which can disclose your home location or personal details when shared."
    },
    {
      "question": "Does this tool compress or reduce image quality?",
      "answer": "No! We only modify binary metadata headers (APP1/ancillary chunks). The compressed pixel stream (SOS/IDAT chunks) is left untouched, keeping 100% of the original visual quality."
    },
    {
      "question": "Which image formats are supported?",
      "answer": "EXIF-Clear strips metadata from standard JPEG/JPG, PNG, and WebP files entirely offline."
    },
    {
      "question": "How are GPS coordinates parsed?",
      "answer": "We inspect the APP1 segment and locate the TIFF structure tags. If GPS directory pointers are found, we read latitude and longitude values for review."
    }
  ],
  "footerTagline": "Free, private, and local image metadata cleaning utility.",
  "footerCredit": "Part of the oLoveTools suite"
};
