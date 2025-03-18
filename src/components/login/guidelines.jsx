import React, { useState } from "react";
import "./guidelines.css";

// Import your images (make sure they are in the src folder)
import image1 from './assets/guide1.png';
import image2 from './assets/guide2.png';
import image3 from './assets/guide3.png';
import image4 from './assets/guide4.png';
import image5 from './assets/guide5.png';
import image6 from './assets/guide6.png';
import image7 from './assets/guide8.png';
import image8 from './assets/guide7.png';
import image9 from './assets/guide9.png';
import image10 from './assets/guide10.jpg';
import image11 from './assets/guide11.jpg';
import image12 from './assets/guide12.jpg';

function App() {
  // Array of images and their descriptions
  const images = [
    { src: image1, description: "New Flagged Incident. Then click close." },
    { src: image2, description: "It will be seen in the flagged Incidents reports. Click validate to view." },
    { src: image3, description: "After you click the validate button you come up to this and to see whether it is valid or invalid. Click accept if it is valid." },
    { src: image4, description: "If you click accept it will go directly to the Accepted Incident pannel. Then click view." },
    { src: image5, description: "You can see here the Location of the sender and you can press the share location to scan the QR code of the location." },
    { src: image6, description: "Here you can scan the QR code by you phone." },
    { src: image5, description: "And if you click decline you will go directly to the Decline Incidents pannel." },
    { src: image7, description: "Here in decline pannel you can click the view." },
    { src: image9, description: "Inside you can choose to resolve if it is solved and accept if you want." },
    { src: image5, description: "And if you click resolve you will go directly to the Resolve Incidents pannel." },
    { src: image8, description: "In resolve pannel it means it is solved." },
    { src: image11, description: "Mobile Dashboard. It has four buttons, when you click a button." },
    { src: image10, description: "It will directly go to this." },
    { src: image12, description: "You can now capture the Incident." },
  ];

  // State to track the current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State to track whether the gallery is visible
  const [showGallery, setShowGallery] = useState(false);

  // Function to handle the "Next" button click
  const handleNext = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Function to handle the "Back" button click (for image navigation)
  const handleBack = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Function to start the gallery
  const startGallery = () => {
    setShowGallery(true);
  };

  // Function to return to the front page
  const returnToStart = () => {
    setShowGallery(false);
    setCurrentImageIndex(0); // Reset to the first image
  };

  return (
    <div className="App">
      <h1>Dashboard Guidelines</h1>
      {!showGallery ? (
        // Front page content
        <div className="front-page">
          <h2>The Dashboard is designed to help users track, manage, and respond to fire-related incidents efficiently.
          Below are the key features and guidelines for using the dashboard effectively.</h2>
          <p className="description">
          Navigation Panel (Left Sidebar)<br />
  Dashboard: Returns to the main dashboard view.<br />
  Settings: Allows users to customize system preferences.<br />
  Guidelines: Provides help and best practices (current section).<br />
  Logout: Securely logs out of the system.
          </p>
          <button onClick={startGallery} className="start-button">
            Start Guidelines
          </button>
        </div>
      ) : (
        // Gallery content
        <div className="container">
          <div className="gallery">
            <img
              src={images[currentImageIndex].src}
              alt="Gallery"
              className="gallery-image"
            />
            <p className="image-description">
              {images[currentImageIndex].description}
            </p>
            <div className="buttons">
              <button onClick={handleBack} className="nav-button">
                Back
              </button>
              <button onClick={handleNext} className="nav-button">
                Next
              </button>
              <button onClick={returnToStart} className="nav-button">
                Return to Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;