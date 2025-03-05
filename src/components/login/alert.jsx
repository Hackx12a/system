  import React, { useState, useEffect } from "react";
  import { collection, onSnapshot } from 'firebase/firestore';
  import { db } from './firebase';
  import "./alert.css";
  import { GeoPoint } from "firebase/firestore";
  import myAudio from './assets/alarm.mp3';
  import { doc, updateDoc } from 'firebase/firestore';


  const AlertNotification = () => {
    const [incidents, setIncidents] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [viewModal, setViewModal] = useState(false);
    const [validateModal, setValidateModal] = useState(false);
    const [declinedModal, setDeclinedModal] = useState(false);
    const [filter, setFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [collectionName, setCollectionName] = useState("FireIncident");
    const [newFlaggedIncident, setNewFlaggedIncident] = useState(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [audio] = useState(new Audio(myAudio)); // Create an audio object
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [mapsLoaded, setMapsLoaded] = useState(false); // State to track if maps are loaded

    useEffect(() => {
        const loadMaps = () => {
            if (window.google) {
                setMapsLoaded(true);
            }
        };

        // Load Google Maps API
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = loadMaps;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script); // Cleanup script on unmount
        };
    }, []);

    useEffect(() => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              setUserLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
              });
          }, (error) => {
              console.error("Error getting location: ", error);
          });
      } else {
          console.error("Geolocation is not supported by this browser.");
      }
  }, []);

  const computeDistance = (coords1, coords2) => {
    const point1 = new window.google.maps.LatLng(coords1.latitude, coords1.longitude);
    const point2 = new window.google.maps.LatLng(coords2.latitude, coords2.longitude);
    return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000; // Distance in km
};

useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (querySnapshot) => {
        const incidentsData = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const formattedTimestamp = data.timestamp 
                ? new Date(data.timestamp.seconds * 1000).toLocaleString() 
                : "N/A";

            const incidentLocation = {
                latitude: data.location._lat,
                longitude: data.location._long,
            };

            // Check if user location is available
            if (userLocation && computeDistance(userLocation, incidentLocation) <= 4) {
                incidentsData.push({
                    id: doc.id,
                    incidentId: data.incidentId,
                    severity: data.severity,
                    timestamp: formattedTimestamp,
                    location: data.location,
                    status: data.status,
                    image: data.image,
                });

                // Check for new flagged incident
                if (data.status === "Flagged") {
                    setNewFlaggedIncident({
                        id: doc.id,
                        incidentId: data.incidentId,
                        severity: data.severity,
                        timestamp: formattedTimestamp,
                        location: data.location,
                        status: data.status,
                        image: data.image,
                    });
                    setShowAlertModal(true); // Show modal
                    playAlertSound(); // Play alert sound
                }
            }
        });
        setIncidents(incidentsData);
    });

    return () => {
        unsubscribe(); // Clean up the listener on unmount
        audio.pause(); // Stop audio on unmount
        audio.currentTime = 0; // Reset audio position
    };
}, [collectionName, audio, userLocation]);


    const toggleFullscreen = (imageElement) => {
      if (!isFullscreen) {
          if (imageElement.requestFullscreen) {
              imageElement.requestFullscreen();
          } else if (imageElement.mozRequestFullScreen) { // Firefox
              imageElement.mozRequestFullScreen();
          } else if (imageElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
              imageElement.webkitRequestFullscreen();
          } else if (imageElement.msRequestFullscreen) { // IE/Edge
              imageElement.msRequestFullscreen();
          }
      } else {
          if (document.fullscreenElement) { // Check if currently in fullscreen
              document.exitFullscreen().catch(err => {
                  console.error("Error exiting fullscreen: ", err);
              });
          }
      }
      setIsFullscreen(!isFullscreen);
  };





    const playAlertSound = () => {
      audio.loop = true; // Set audio to loop
      audio.play().catch(error => {
        console.error("Error playing sound: ", error);
      });
    };

    const handleUserInteraction = () => {
      setUserInteracted(true);
      // Hide modal when user interacts
    };

   

    const closeModal = () => {
      setSelectedNotification(null);
      setViewModal(false);
      setValidateModal(false);
      setDeclinedModal(false);
      setShowAlertModal(false); // Close alert modal
      audio.pause(); // Stop audio
      audio.currentTime = 0; // Reset audio position
    };

    const handleAccept = async (id) => {
      try {
          const docRef = doc(db, collectionName, id);
          await updateDoc(docRef, {
              status: "Accepted"
          });
  
          setIncidents(incidents.map(notif => 
              notif.id === id ? { ...notif, status: "Accepted" } : notif
          ));
          closeModal();
      } catch (error) {
          console.error("Error accepting incident: ", error);
      }
  };
  
  const handleDecline = async (id) => {
      try {
          const docRef = doc(db, collectionName, id);
          await updateDoc(docRef, {
              status: "Declined"
          });
  
          setIncidents(incidents.map(notif => 
              notif.id === id ? { ...notif, status: "Declined" } : notif
          ));
          closeModal();
      } catch (error) {
          console.error("Error declining incident: ", error);
      }
  };
  
  const handleResolve = async (id) => {
      try {
          const docRef = doc(db, collectionName, id);
          await updateDoc(docRef, {
              status: "Resolved"
          });
  
          setIncidents(incidents.map(notif => 
              notif.id === id ? { ...notif, status: "Resolved" } : notif
          ));
          closeModal();
      } catch (error) {
          console.error("Error resolving incident: ", error);
      }
  };

    const handleValidate = (notif) => {
    setSelectedNotification(notif);
    setValidateModal(true);
    };

 
    const handleView = (notif) => {
      setSelectedNotification(notif);
      setViewModal(true);
      audio.pause(); // Stop audio when viewing details
      audio.currentTime = 0; // Reset audio position
    };

    const handleDeclinedView = (notif) => {
      setSelectedNotification(notif);
      setDeclinedModal(true);
    };


    const handleShareLocation = (location) => {
      alert(`Sharing location: ${location}`);
      // Implement actual sharing logic here
    };

    // Count notifications based on their status
    const flaggedCount = incidents.filter(incident => incident.status === "Flagged").length;
    const acceptedCount = incidents.filter(incident => incident.status === "Accepted").length;
    const declinedCount = incidents.filter(incident => incident.status === "Declined").length;
    const resolvedCount = incidents.filter(incident => incident.status === "Resolved").length;
    const allCount = incidents.length;

    // Filter notifications based on the selected filter
    const filteredNotifications = filter === "All" ? incidents : incidents.filter(notif => notif.status === filter);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

    return (
      <div className="alert-container" onClick={handleUserInteraction} >
        <h2>{collectionName}</h2> 

        {/* Modal for New Flagged Incident */}
        {showAlertModal && newFlaggedIncident && (
          <div className="modal-overlay">
            <div className="alertmodal">
              <h3>New Flagged Incident!</h3>
              <div className="modal-buttons">
                <button className="alertbutton" onClick={closeModal} >Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Navbar with Incident Counts */}
        <div className="navbar">
          <span className={`incident flagged ${filter === "Flagged" ? "active" : ""}`} onClick={() => setFilter("Flagged")}>
            Flagged Incidents <span className="count">{flaggedCount}</span>
          </span>
          <span className={`incident accepted ${filter === "Accepted" ? "active" : ""}`} onClick={() => setFilter("Accepted")}>
            Accepted Incidents <span className="count">{acceptedCount}</span>
          </span>
          <span className={`incident declined ${filter === "Declined" ? "active" : ""}`} onClick={() => setFilter("Declined")}>
            Declined Incidents <span className="count">{declinedCount}</span>
          </span>
          <span className={`incident resolved ${filter === "Resolved" ? "active" : ""}`} onClick={() => setFilter("Resolved")}>
            Resolved Incidents <span className="count">{resolvedCount}</span>
          </span>
          <span className={`incident all ${filter === "All" ? "active" : ""}`} onClick={() => setFilter("All")}>
            All Incidents <span className="count">{allCount}</span>
          </span>
        </div>

        {/* Pagination between Navbar and Table */}
        <div className="pagination">
          <span className="icon left" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>&#9664;</span>
          {[...Array(totalPages)].map((_, index) => (
            <span
              key={index + 1}
              className={`page-number ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </span>
          ))}
          <span className="icon right" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>&#9654;</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Incident Id</th>
              <th>Severity</th>
              <th>Timestamp</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((incident) => (
              <tr className="incident-row" key={incident.id}>
                <td>{incident.id}</td>
                <td>{incident.severity}</td>
                <td>{incident.timestamp}</td>
                <td>{typeof incident.location === 'object' ? `${incident.location._lat}, ${incident.location._long}` : incident.location}</td>
                <td>
                  <span className={`status-text status-${incident.status.toLowerCase()}`}>
                    {incident.status}
                  </span>
                </td>
                <td>
                  {incident.status === 'Flagged' ? (
                    <button className="validate-button" onClick={() => handleValidate(incident)}>
                      Validate
                    </button>
                  ) : incident.status === 'Declined' ? (
                    <button className="view-button" onClick={() => handleDeclinedView(incident)}>
                      View
                    </button>
                  ) : incident.status === 'Accepted' || incident.status === 'Resolved' ? (
                    <button className="view-button" onClick={() => handleView(incident)}>
                      View
                    </button>
                  ) : (
                    <span>N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedNotification && validateModal &&(
    <div className="modal-overlay">
      <div className="modal">
        
        
      <img src={selectedNotification.image} alt="Notification" className="modal-image"  onClick={(e) => toggleFullscreen(e.target)}/>
      <div className="modal-buttons">
          <button className="accept-button" onClick={() => handleAccept(selectedNotification.id)}>Accept</button>
          <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button>
        </div>
        <div className="map-container">
          <h4>Location Map:</h4>
          {selectedNotification.location && selectedNotification.location instanceof GeoPoint ? (
            <iframe
              title="Location Map"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`}
              width="100%"
              height="350"
              allowFullScreen
            ></iframe>
          ) : (
            <p>No location available</p>
          )}
        </div>
        <button className="close-button" onClick={closeModal}>X</button>
      </div>
    </div>
  )}


        {selectedNotification && declinedModal && (
          <div className="modal-overlay">
            <div className="modal">
            <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)}/>
            <div className="modal-buttons">
                <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button>
                <button className="accept-button" onClick={() => handleAccept(selectedNotification.id)}>Accept</button>
              </div>
              <div className="map-container">
                <h4>Location Map:</h4>
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? (
                  <iframe
                    title="Location Map"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`}
                    width="100%"
                    height="350"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <p>No location available</p>
                )}
              </div>
      
              <button className="close-button" onClick={closeModal}>X</button>
            </div>
          </div>
        )}

        {selectedNotification && viewModal && selectedNotification.status === "Accepted" && (
          <div className="modal-overlay">
            <div className="modal">
          
              <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)}/>
              <div className="modal-buttons">
                <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button>
                <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button>
                <button className="share-button" onClick={() => handleShareLocation(selectedNotification.location)}>Share Location</button>
              </div>
              <div className="map-container">
                <h4>Location Map:</h4>
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? (
                  <iframe
                    title="Location Map"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`}
                    width="100%"
                    height="350"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <p>No location available</p>
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button>
            </div>
          </div>
        )}

        {selectedNotification && viewModal && selectedNotification.status === "Resolved" && (
          <div className="modal-overlay">
            <div className="modal">
            <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)}/>
              <div className="map-container">
                <h4>Location Map:</h4>
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? (
                  <iframe
                    title="Location Map"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`}
                    width="100%"
                    height="350"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <p>No location available</p>
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default AlertNotification;
