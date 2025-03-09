import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import "./alert.css";
import { GeoPoint } from "firebase/firestore";
import myAudio from './assets/alarm.mp3';
import { doc, updateDoc, getDocs } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';


const AlertNotification = () => {
    const [qrCodeModal, setQrCodeModal] = useState(false);
    const [qrCodeLocation, setQrCodeLocation] = useState('');
    const [incidents, setIncidents] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [viewModal, setViewModal] = useState(false);
    const [validateModal, setValidateModal] = useState(false);
    const [declinedModal, setDeclinedModal] = useState(false);
    const [filter, setFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const [newFlaggedIncident, setNewFlaggedIncident] = useState(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [audio] = useState(new Audio(myAudio));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [collectionName, setCollectionName] = useState("loading.....");
    const userEmail = sessionStorage.getItem('email');
    
    
 
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const usersRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersRef);
                let found = false;
    
                for (const doc of querySnapshot.docs) {
                    if (doc.data().email === userEmail) {
                        setCollectionName(doc.data().department);
                        found = true;
                        break; // Exit the loop once the user is found
                    }
                }
    
                if (!found) {
                    console.error("User not found in Firestore");
                }
            } catch (error) {
                console.error("Error fetching user data: ", error);
            }
        };
    
        fetchUserData();
    }, [userEmail]);
    




    

    // Effect to load Google Maps API
    useEffect(() => {
        const loadMaps = () => {
            if (window.google) {
                setMapsLoaded(true);
                // Initialize any Google Maps functionality here if needed
            }
        };
    
        // Check if Google Maps API is already loaded
        if (!window.google) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&libraries=geometry`;
            script.async = true;
            script.defer = true;
            script.onload = loadMaps;
            document.body.appendChild(script);
    
            // Cleanup function to remove the script
            return () => {
                document.body.removeChild(script);
            };
        } else {
            loadMaps(); // If already loaded, call the loadMaps function directly
        }
    }, []);

    // Effect to get user's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setUserLocation(currentLocation);
                console.log("Current Location:", currentLocation); // Added console log
            }, (error) => {
                console.error("Error getting location: ", error);
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }, []);
    
    // Function to compute distance between two geographical coordinates
    const computeDistance = (coords1, coords2) => {
        const point1 = new window.google.maps.LatLng(coords1.latitude, coords1.longitude);
        const point2 = new window.google.maps.LatLng(coords2.latitude, coords2.longitude);
        return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000;
    };

    // Effect to fetch incidents data from Firestore and filter based on distance
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
                        setShowAlertModal(true);
                        playAlertSound();
                    }
                }
            });
            setIncidents(incidentsData);
        });

        return () => {
            unsubscribe();
            audio.pause();
            audio.currentTime = 0;
        };
    }, [collectionName, audio, userLocation]);

    // Function to toggle fullscreen mode for images
    const toggleFullscreen = (imageElement) => {
        if (!isFullscreen) {
            if (imageElement.requestFullscreen) {
                imageElement.requestFullscreen();
            } else if (imageElement.mozRequestFullScreen) {
                imageElement.mozRequestFullScreen();
            } else if (imageElement.webkitRequestFullscreen) {
                imageElement.webkitRequestFullscreen();
            } else if (imageElement.msRequestFullscreen) {
                imageElement.msRequestFullscreen();
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error("Error exiting fullscreen: ", err);
                });
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Function to play alert sound
    const playAlertSound = () => {
        audio.loop = true;
        audio.play().catch(error => {
            console.error("Error playing sound: ", error);
        });
    };
 

    // Function to handle user interaction with the UI
    const handleUserInteraction = () => {
        setUserInteracted(true);
    };

    // Function to close modals and reset states
    const closeModal = () => {
        setSelectedNotification(null);
        setViewModal(false);
        setValidateModal(false);
        setDeclinedModal(false);
        setShowAlertModal(false);
        audio.pause();
        audio.currentTime = 0;
    };

    // Function to accept an incident
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

    // Function to decline an incident
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

    // Function to resolve an incident
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

    // Function to handle validation of a notification
    const handleValidate = (notif) => {
        setSelectedNotification(notif);
        setValidateModal(true);
    };

    // Function to handle viewing of a notification
    const handleView = (notif) => {
        setSelectedNotification(notif);
        setViewModal(true);
        audio.pause();
        audio.currentTime = 0;
    };

    // Function to handle viewing of a declined notification
    const handleDeclinedView = (notif) => {
        setSelectedNotification(notif);
        setDeclinedModal(true);
    };


    // Function to handle sharing of location
    const handleShareLocation = (location) => {
        const locationUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        setQrCodeLocation(locationUrl);
        setQrCodeModal(true);
        setViewModal(false);
    };

    // Function to close the QR code modal
    const closeQrCodeModal = () => {
        setQrCodeModal(false);
    };

    // Count notifications based on their status
    const flaggedCount = incidents.filter(incident => incident.status === "Flagged").length;
    const acceptedCount = incidents.filter(incident => incident.status === "Accepted").length;
    const declinedCount = incidents.filter(incident => incident.status === "Declined").length;
    const resolvedCount = incidents.filter(incident => incident.status === "Resolved").length;
    const allCount = incidents.length;

    // Filter notifications based on the selected filter
    const filteredNotifications = filter === "All" ? incidents : incidents.filter(notif => notif.status === filter);

    // Calculate pagination indices
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);


    return (
        <div className="alert-container" onClick={handleUserInteraction}>
            <h2>{collectionName}</h2>

           

        

            {/* Modal for New Flagged Incident */}
            {showAlertModal && newFlaggedIncident && (
                <div className="modal-overlay">
                    <div className="alertmodal">
                        <h3>New Flagged Incident!</h3>
                        <div className="modal-buttons">
                            <button className="alertbutton" onClick={closeModal}>Close</button>
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

            {/* QR Code Modal for sharing location */}
            {qrCodeModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Share Location QR Code</h3>
                        <QRCodeSVG value={qrCodeLocation} size={256} />
                        <div className="modal-buttons">
                            <button className="close-button" onClick={closeQrCodeModal}>x</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal for selected notification */}
            {selectedNotification && validateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} />
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

            {/* Declined Modal for selected notification */}
            {selectedNotification && declinedModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} />
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

            {/* View Modal for Accepted Notifications */}
            {selectedNotification && viewModal && selectedNotification.status === "Accepted" && (
                <div className="modal-overlay">
                    <div className="modal">
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} />
                        <div className="modal-buttons">
                            <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button> {/* Decline button */}
              </div>
              <div className="map-container"> {/* Container for location map */}
                <h4>Location Map:</h4> {/* Map title */}
                {selectedNotification.location && selectedNotification.location instanceof GeoPoint ? ( // Check if location is available and is a GeoPoint
                  <iframe
                    title="Location Map" // Title for the iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`} // Embed Google Maps with the location
                    width="100%" // Set width of the iframe
                    height="350" // Set height of the iframe
                    allowFullScreen // Allow fullscreen mode
                  ></iframe>
                ) : (
                  <p>No location available</p> // Message if no location is available
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button> {/* Close button for modal */}
            </div>
          </div>
        )}

        {/* Declined Modal for selected notification */}
        {selectedNotification && declinedModal && ( // Render modal if a notification is selected and declined modal is open
          <div className="modal-overlay"> {/* Overlay for modal */}
            <div className="modal"> {/* Modal container */}
              <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image with fullscreen toggle */}
              <div className="modal-buttons"> {/* Container for modal buttons */}
                <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button> {/* Resolve button */}
                <button className="accept-button" onClick={() => handleAccept(selectedNotification.id)}>Accept</button> {/* Accept button */}
              </div>
              <div className="map-container"> {/* Container for location map */}
                <h4>Location Map:</h4> {/* Map title */}
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? ( // Check if location is available and is a GeoPoint
                  <iframe
                    title="Location Map" // Title for the iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`} // Embed Google Maps with the location
                    width="100%" // Set width of the iframe
                    height="350" // Set height of the iframe
                    allowFullScreen // Allow fullscreen mode
                  ></iframe>
                ) : (
                  <p>No location available</p> // Message if no location is available
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button> {/* Close button for modal */}
            </div>
          </div>
        )}

        {/* View Modal for Accepted Notifications */}
        {selectedNotification && viewModal && selectedNotification.status === "Accepted" && ( // Render modal if a notification is selected, view modal is open, and status is Accepted
          <div className="modal-overlay"> {/* Overlay for modal */}
            <div className="modal"> {/* Modal container */}
              <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image with fullscreen toggle */}
              <div className="modal-buttons"> {/* Container for modal buttons */}
                <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button> {/* Decline button */}
                <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button> {/* Resolve button */}
                <button className="share-button" onClick={() => handleShareLocation(selectedNotification.location)}>Share Location</button> {/* Share location button */}
              </div>
              <div className="map-container"> {/* Container for location map */}
                <h4>Location Map:</h4> {/* Map title */}
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? ( // Check if location is available and is a GeoPoint
                  <iframe
                    title="Location Map" // Title for the iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`} // Embed Google Maps with the location
                    width="100%" // Set width of the iframe
                    height="350" // Set height of the iframe
                    allowFullScreen // Allow fullscreen mode
                  ></iframe>
                ) : (
                  <p>No location available</p> // Message if no location is available
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button> {/* Close button for modal */}
            </div>
          </div>
        )}

        {/* View Modal for Resolved Notifications */}
        {selectedNotification && viewModal && selectedNotification.status === "Resolved" && ( // Render modal if a notification is selected, view modal is open, and status is Resolved
          <div className="modal-overlay"> {/* Overlay for modal */}
            <div className="modal"> {/* Modal container */}
              <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image with fullscreen toggle */}
              <div className="map-container"> {/* Container for location map */}
                <h4>Location Map:</h4> {/* Map title */}
                {selectedNotification && selectedNotification.location && selectedNotification.location instanceof GeoPoint ? ( // Check if location is available and is a GeoPoint
                  <iframe
                    title="Location Map" // Title for the iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&q=${encodeURIComponent(`${selectedNotification.location.latitude}, ${selectedNotification.location.longitude}`)}`} // Embed Google Maps with the location
                    width="100%" // Set width of the iframe
                    height="350" // Set height of the iframe
                    allowFullScreen // Allow fullscreen mode
                  ></iframe>
                ) : (
                  <p>No location available</p> // Message if no location is available
                )}
              </div>
              <button className="close-button" onClick={closeModal}>X</button> {/* Close button for modal */}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default AlertNotification;
