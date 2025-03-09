import React, { useState, useEffect } from "react"; // Import React and necessary hooks
import { collection, onSnapshot } from 'firebase/firestore'; // Import Firestore functions for data handling
import { db } from './firebase'; // Import Firestore database instance
import "./alert.css"; // Import CSS for styling
import { GeoPoint } from "firebase/firestore"; // Import GeoPoint for handling geographical data
import myAudio from './assets/alarm.mp3'; // Import audio file for alerts
import { doc, updateDoc, getDocs } from 'firebase/firestore'; // Import Firestore functions for document handling
import { QRCodeSVG } from 'qrcode.react'; // Import QRCode component for generating QR codes

const AlertNotification = () => {
    // State variables for managing component state
    const [qrCodeModal, setQrCodeModal] = useState(false); // Controls visibility of QR code modal
    const [qrCodeLocation, setQrCodeLocation] = useState(''); // Stores the location for QR code generation
    const [incidents, setIncidents] = useState([]); // Stores the list of incidents fetched from Firestore
    const [selectedNotification, setSelectedNotification] = useState(null); // Stores the currently selected notification
    const [viewModal, setViewModal] = useState(false); // Controls visibility of the view modal
    const [validateModal, setValidateModal] = useState(false); // Controls visibility of the validation modal
    const [declinedModal, setDeclinedModal] = useState(false); // Controls visibility of the declined modal
    const [filter, setFilter] = useState("All"); // Stores the current filter for incidents
    const [currentPage, setCurrentPage] = useState(1); // Stores the current page for pagination
    const itemsPerPage = 15; // Number of items to display per page
    const [newFlaggedIncident, setNewFlaggedIncident] = useState(null); // Stores new flagged incidents
    const [userInteracted, setUserInteracted] = useState(false); // Tracks user interaction to manage alerts
    const [showAlertModal, setShowAlertModal] = useState(false); // Controls visibility of the alert modal
    const [audio] = useState(new Audio(myAudio)); // Initializes audio for alert sounds
    const [isFullscreen, setIsFullscreen] = useState(false); // Tracks fullscreen state for images
    const [userLocation, setUserLocation] = useState(null); // Stores user's current geographical location
    const [mapsLoaded, setMapsLoaded] = useState(false); // Tracks if Google Maps API is loaded
    const [collectionName, setCollectionName] = useState("loading....."); // Stores the name of the Firestore collection
    const userEmail = sessionStorage.getItem('email'); // Retrieves user's email from session storage

    // Effect to fetch user data from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const usersRef = collection(db, 'users'); // Reference to the users collection
                const querySnapshot = await getDocs(usersRef); // Fetch all users
                let found = false; // Flag to check if user is found

                for (const doc of querySnapshot.docs) {
                    if (doc.data().email === userEmail) { // Check if the email matches
                        setCollectionName(doc.data().department); // Set the collection name based on user's department
                        found = true; // User found
                        break; // Exit loop once user is found
                    }
                }

                if (!found) {
                    console.error("User not found in Firestore"); // Log error if user is not found
                }
            } catch (error) {
                console.error("Error fetching user data: ", error); // Log any errors during fetching
            }
        };

        fetchUserData(); // Call the function to fetch user data
    }, [userEmail]); // Dependency array to run effect when userEmail changes

    // Effect to load Google Maps API
    useEffect(() => {
        const loadMaps = () => {
            if (window.google) {
                setMapsLoaded(true); // Set mapsLoaded to true if Google Maps is already loaded
                // Initialize any Google Maps functionality here if needed
            }
        };

        // Check if Google Maps API is already loaded
        if (!window.google) {
            const script = document.createElement("script"); // Create a script element
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDaiKm4dWcZ5pUX5Whl5RpigDCFcPipkto&libraries=geometry`; // Set the source to Google Maps API
            script.async = true; // Load the script asynchronously
            script.defer = true; // Defer execution until after the document has been parsed
            script.onload = loadMaps; // Load maps once the script is loaded
            document.body.appendChild(script); // Append the script to the document body

            // Cleanup function to remove the script
            return () => {
                document.body.removeChild(script); // Remove the script when the component unmounts
            };
        } else {
            loadMaps(); // If already loaded, call loadMaps directly
        }
    }, []); // Empty dependency array to run effect only once on mount

    // Effect to get user's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const currentLocation = {
                    latitude: position.coords.latitude, // Get latitude from position
                    longitude: position.coords.longitude, // Get longitude from position
                };
                setUserLocation(currentLocation); // Set user's current location
                console.log("Current Location:", currentLocation); // Log current location
            }, (error) => {
                console.error("Error getting location: ", error); // Log any errors during geolocation
            });
        } else {
            console.error("Geolocation is not supported by this browser."); // Log if geolocation is not supported
        }
    }, []); // Empty dependency array to run effect only once on mount

    // Function to compute distance between two geographical coordinates
    const computeDistance = (coords1, coords2) => {
        const point1 = new window.google.maps.LatLng(coords1.latitude, coords1.longitude); // Create LatLng object for first coordinates
        const point2 = new window.google.maps.LatLng(coords2.latitude, coords2.longitude); // Create LatLng object for second coordinates
        return window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000; // Compute distance in kilometers
    };

    // Effect to fetch incidents data from Firestore and filter based on distance
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, collectionName), (querySnapshot) => {
            const incidentsData = []; // Array to store fetched incidents
            querySnapshot.forEach((doc) => {
                const data = doc.data(); // Get data from each document
                const formattedTimestamp = data.timestamp 
                    ? new Date(data.timestamp.seconds * 1000).toLocaleString() // Format timestamp to readable string
                    : "N/A"; // Set to "N/A" if no timestamp

                const incidentLocation = {
                    latitude: data.location._lat, // Get latitude from location
                    longitude: data.location._long, // Get longitude from location
                };

                // Check if user is within 4 km of the incident
                if (userLocation && computeDistance(userLocation, incidentLocation) <= 4) {
                    incidentsData.push({
                        id: doc.id, // Store document ID
                        incidentId: data.incidentId, // Store incident ID
                        severity: data.severity, // Store severity
                        timestamp: formattedTimestamp, // Store formatted timestamp
                        location: data.location, // Store location
                        status: data.status, // Store status
                        image: data.image, // Store image URL
                    });

                    // Check if the incident is flagged
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
                        setShowAlertModal(true); // Show alert modal for new flagged incident
                        playAlertSound(); // Play alert sound for flagged incident
                    }
                }
            });
            setIncidents(incidentsData); // Update incidents state with fetched data
        });

        return () => {
            unsubscribe(); // Unsubscribe from Firestore updates
            audio.pause(); // Pause audio when component unmounts
            audio.currentTime = 0; // Reset audio to start
        };
    }, [collectionName, audio, userLocation]); // Dependencies to rerun effect when these values change

    // Function to toggle fullscreen mode for images
    const toggleFullscreen = (imageElement) => {
        if (!isFullscreen) {
            if (imageElement.requestFullscreen) {
                imageElement.requestFullscreen(); // Request fullscreen for the image
            } else if (imageElement.mozRequestFullScreen) {
                imageElement.mozRequestFullScreen(); // For Firefox
            } else if (imageElement.webkitRequestFullscreen) {
                imageElement.webkitRequestFullscreen(); // For Chrome
            } else if (imageElement.msRequestFullscreen) {
                imageElement.msRequestFullscreen(); // For IE/Edge
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error("Error exiting fullscreen: ", err); // Log error if exiting fullscreen fails
                });
            }
        }
        setIsFullscreen(!isFullscreen); // Toggle fullscreen state
    };

    // Function to play alert sound
    const playAlertSound = () => {
        audio.loop = true; // Loop the audio
        audio.play().catch(error => {
            console.error("Error playing sound: ", error); // Log any errors during playback
        });
    };

    // Function to handle user interaction with the UI
    const handleUserInteraction = () => {
        setUserInteracted(true); // Set user interaction state to true
    };

    // Function to close modals and reset states
    const closeModal = () => {
        setSelectedNotification(null); // Reset selected notification
        setViewModal(false); // Close view modal
        setValidateModal(false); // Close validation modal
        setDeclinedModal(false); // Close declined modal
        setShowAlertModal(false); // Close alert modal
        audio.pause(); // Pause audio
        audio.currentTime = 0; // Reset audio to start
    };

    // Function to accept an incident
    const handleAccept = async (id) => {
        try {
            const docRef = doc(db, collectionName, id); // Get document reference
            await updateDoc(docRef, {
                status: "Accepted" // Update status to "Accepted"
            });

            setIncidents(incidents.map(notif => 
                notif.id === id ? { ...notif, status: "Accepted" } : notif // Update incident status in state
            ));
            closeModal(); // Close modals after accepting
        } catch (error) {
            console.error("Error accepting incident: ", error); // Log error if accepting fails
        }
    };

    // Function to decline an incident
    const handleDecline = async (id) => {
        try {
            const docRef = doc(db, collectionName, id); // Get document reference
            await updateDoc(docRef, {
                status: "Declined" // Update status to "Declined"
            });

            setIncidents(incidents.map(notif => 
                notif.id === id ? { ...notif, status: "Declined" } : notif // Update incident status in state
            ));
            closeModal(); // Close modals after declining
        } catch (error) {
            console.error("Error declining incident: ", error); // Log error if declining fails
        }
    };

    // Function to resolve an incident
    const handleResolve = async (id) => {
        try {
            const docRef = doc(db, collectionName, id); // Get document reference
            await updateDoc(docRef, {
                status: "Resolved" // Update status to "Resolved"
            });

            setIncidents(incidents.map(notif => 
                notif.id === id ? { ...notif, status: "Resolved" } : notif // Update incident status in state
            ));
            closeModal(); // Close modals after resolving
        } catch (error) {
            console.error("Error resolving incident: ", error); // Log error if resolving fails
        }
    };

    // Function to handle validation of a notification
    const handleValidate = (notif) => {
        setSelectedNotification(notif); // Set selected notification
        setValidateModal(true); // Open validation modal
    };

    // Function to handle viewing of a notification
    const handleView = (notif) => {
        setSelectedNotification(notif); // Set selected notification
        setViewModal(true); // Open view modal
        audio.pause(); // Pause audio when viewing
        audio.currentTime = 0; // Reset audio to start
    };

    // Function to handle viewing of a declined notification
    const handleDeclinedView = (notif) => {
        setSelectedNotification(notif); // Set selected notification
        setDeclinedModal(true); // Open declined modal
    };

    // Function to handle sharing of location
    const handleShareLocation = (location) => {
        const locationUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`; // Create URL for location
        setQrCodeLocation(locationUrl); // Set QR code location
        setQrCodeModal(true); // Open QR code modal
        setViewModal(false); // Close view modal
    };

    // Function to close the QR code modal
    const closeQrCodeModal = () => {
        setQrCodeModal(false); // Close QR code modal
    };

    // Count notifications based on their status
    const flaggedCount = incidents.filter(incident => incident.status === "Flagged").length; // Count flagged incidents
    const acceptedCount = incidents.filter(incident => incident.status === "Accepted").length; // Count accepted incidents
    const declinedCount = incidents.filter(incident => incident.status === "Declined").length; // Count declined incidents
    const resolvedCount = incidents.filter(incident => incident.status === "Resolved").length; // Count resolved incidents
    const allCount = incidents.length; // Count all incidents

    // Filter notifications based on the selected filter
    const filteredNotifications = filter === "All" ? incidents : incidents.filter(notif => notif.status === filter); // Get filtered notifications

    // Calculate pagination indices
    const indexOfLastItem = currentPage * itemsPerPage; // Index of the last item on the current page
    const indexOfFirstItem = indexOfLastItem - itemsPerPage; // Index of the first item on the current page
    const currentItems = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem); // Get items for the current page
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage); // Calculate total pages for pagination

    return (
        <div className="alert-container" onClick={handleUserInteraction}> {/* Main container for alerts */}
            <h2>{collectionName}</h2> {/* Display collection name */}
            <title>Dashboard</title>

            {/* Modal for New Flagged Incident */}
            {showAlertModal && newFlaggedIncident && (
                <div className="modal-overlay"> {/* Overlay for modal */}
                    <div className="alertmodal"> {/* Modal container */}
                        <h3>New Flagged Incident!</h3> {/* Modal title */}
                        <div className="modal-buttons"> {/* Button container */}
                            <button className="alertbutton" onClick={closeModal}>Close</button> {/* Close button */}
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar with Incident Counts */}
            <div className="navbar"> {/* Navigation bar for incident counts */}
                <span className={`incident flagged ${filter === "Flagged" ? "active" : ""}`} onClick={() => setFilter("Flagged")}>
                    Flagged Incidents <span className="count">{flaggedCount}</span> {/* Display count of flagged incidents */}
                </span>
                
                <span className={`incident accepted ${filter === "Accepted" ? "active" : ""}`} onClick={() => setFilter("Accepted")}>
                    Accepted Incidents <span className="count">{acceptedCount}</span> {/* Display count of accepted incidents */}
                </span>
                <span className={`incident declined ${filter === "Declined" ? "active" : ""}`} onClick={() => setFilter("Declined")}>
                    Declined Incidents <span className="count">{declinedCount}</span> {/* Display count of declined incidents */}
                </span>
                <span className={`incident resolved ${filter === "Resolved" ? "active" : ""}`} onClick={() => setFilter("Resolved")}>
                    Resolved Incidents <span className="count">{resolvedCount}</span> {/* Display count of resolved incidents */}
                </span>
                <span className={`incident all ${filter === "All" ? "active" : ""}`} onClick={() => setFilter("All")}>
                    All Incidents <span className="count">{allCount}</span> {/* Display count of all incidents */}
                </span>
            </div>

            {/* Pagination between Navbar and Table */}
            <div className="pagination"> {/* Pagination controls */}
                <span className="icon left" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>&#9664;</span> {/* Previous page icon */}
                {[...Array(totalPages)].map((_, index) => ( // Create page numbers based on total pages
                    <span
                        key={index + 1}
                        className={`page-number ${currentPage === index + 1 ? "active" : ""}`} // Highlight current page
                        onClick={() => setCurrentPage(index + 1)} // Set current page on click
                    >
                        {index + 1} {/* Display page number */}
                    </span>
                ))}
                <span className="icon right" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>&#9654;</span> {/* Next page icon */}
            </div>

            <table> {/* Table to display incidents */}
                <thead>
                    <tr>
                        <th>Incident Id</th>
                        {/* Column for Incident ID */}
                        <th>Severity</th> {/* Column for Severity */}
                        <th>Timestamp</th> {/* Column for Timestamp */}
                        <th>Location</th> {/* Column for Location */}
                        <th>Status</th> {/* Column for Status */}
                        <th>Action</th> {/* Column for Action buttons */}
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((incident) => ( // Map through current items to display each incident
                        <tr className="incident-row" key={incident.id}> {/* Row for each incident */}
                            <td>{incident.id}</td> {/* Display Incident ID */}
                            <td>{incident.severity}</td> {/* Display Severity */}
                            <td>{incident.timestamp}</td> {/* Display Timestamp */}
                            <td>
                                {typeof incident.location === 'object' ? 
                                    `${incident.location._lat}, ${incident.location._long}` : 
                                    incident.location} {/* Display Location coordinates */}
                            </td>
                            <td>
                                <span className={`status-text status-${incident.status.toLowerCase()}`}> {/* Display status with styling */}
                                    {incident.status} {/* Display Status */}
                                </span>
                            </td>
                            <td>
                                {incident.status === 'Flagged' ? ( // Conditional rendering based on status
                                    <button className="validate-button" onClick={() => handleValidate(incident)}>
                                        Validate {/* Button to validate flagged incident */}
                                    </button>
                                ) : incident.status === 'Declined' ? (
                                    <button className="view-button" onClick={() => handleDeclinedView(incident)}>
                                        View {/* Button to view declined incident */}
                                    </button>
                                ) : incident.status === 'Accepted' || incident.status === 'Resolved' ? (
                                    <button className="view-button" onClick={() => handleView(incident)}>
                                        View {/* Button to view accepted or resolved incident */}
                                    </button>
                                ) : (
                                    <span>N/A</span> // Display N/A if no actions are available
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* QR Code Modal for sharing location */}
            {qrCodeModal && ( // Conditional rendering for QR code modal
                <div className="modal-overlay"> {/* Overlay for modal */}
                    <div className="modal"> {/* Modal container */}
                        <h3>Share Location QR Code</h3> {/* Title for QR code modal */}
                        <QRCodeSVG value={qrCodeLocation} size={256} /> {/* Generate QR code for location */}
                        <div className="modal-buttons"> {/* Container for modal buttons */}
                            <button className="close-button" onClick={closeQrCodeModal}>x</button> {/* Close button */}
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Modal for selected notification */}
            {selectedNotification && validateModal && ( // Conditional rendering for validation modal
                <div className="modal-overlay"> {/* Overlay for modal */}
                    <div className="modal"> {/* Modal container */}
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image */}
                        <div className="modal-buttons"> {/* Container for modal buttons */}
                            <button className="accept-button" onClick={() => handleAccept(selectedNotification.id)}>Accept</button> {/* Accept button */}
                            <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button> {/* Decline button */}
                        </div>
                        <div className="map-container"> {/* Container for location map */}
                            <h4>Location Map:</h4> {/* Title for map section */}
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
            {selectedNotification && declinedModal && ( // Conditional rendering for declined modal
                <div className="modal-overlay"> {/* Overlay for modal */}
                    <div className="modal"> {/* Modal container */}
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image */}
                        <div className="modal-buttons"> {/* Container for modal buttons */}
                            <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button> {/* Resolve button */}
                            <button className="accept-button" onClick={() => handleAccept(selectedNotification.id)}>Accept</button> {/* Accept button */}
                        </div>
                        <div className="map-container"> {/* Container for location map */}
                            <h4>Location Map:</h4> {/* Title for map section */}
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
{selectedNotification && viewModal && selectedNotification.status === "Accepted" && ( // Conditional rendering for view modal of accepted notifications
    <div className="modal-overlay"> {/* Overlay for modal */}
        <div className="modal"> {/* Modal container */}
            <img 
                src={selectedNotification.image} 
                alt="Notification" 
                className="modal-image" 
                onClick={(e) => toggleFullscreen(e.target)} 
            /> {/* Display notification image */}
            <div className="modal-buttons"> {/* Container for modal buttons */}
                <button className="decline-button" onClick={() => handleDecline(selectedNotification.id)}>Decline</button> {/* Decline button */}
                <button className="resolve-button" onClick={() => handleResolve(selectedNotification.id)}>Resolve</button> {/* Resolve button */}
                <button className="share-button" onClick={() => handleShareLocation(selectedNotification.location)}>Share Location</button> {/* Share Location button */}
            </div>
            <div className="map-container"> {/* Container for location map */}
                <h4>Location Map:</h4> {/* Title for map section */}
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
            {selectedNotification && viewModal && selectedNotification.status === "Resolved" && ( // Conditional rendering for view modal of resolved notifications
                <div className="modal-overlay"> {/* Overlay for modal */}
                    <div className="modal"> {/* Modal container */}
                        <img src={selectedNotification.image} alt="Notification" className="modal-image" onClick={(e) => toggleFullscreen(e.target)} /> {/* Display notification image */}
                        <div className="map-container"> {/* Container for location map */}
                            <h4>Location Map:</h4> {/* Title for map section */}
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

export default AlertNotification; // Export the component for use in other parts of the application
