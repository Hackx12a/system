import React, { useState } from "react"; // Import React and useState hook for managing state
import { MdOutlineBook } from "react-icons/md"; // Import book icon from react-icons
import { IoSettingsOutline } from "react-icons/io5"; // Import settings icon from react-icons
import "./sidebar.css"; // Import CSS file for styling the sidebar
import { AiOutlineDashboard } from "react-icons/ai"; // Import dashboard icon from react-icons
import { Link, Outlet, useNavigate } from 'react-router-dom'; // Import routing components from react-router-dom
import { TiArrowLeftThick, TiArrowRightThick } from "react-icons/ti"; // Import arrow icons for sidebar toggle
import { auth } from './firebase'; // Import Firebase authentication
import image from './assets/helptrack.png'; // Import logo image
import { MdOutlineLogout } from "react-icons/md"; // Import logout icon from react-icons

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // State to manage sidebar visibility (open/closed)
  const navigate = useNavigate(); // Hook for programmatic navigation

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // Toggle the sidebar's open/close state
  };

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out the user from Firebase
      sessionStorage.removeItem('isAuthenticated'); // Remove authentication status from session storage
      sessionStorage.removeItem('email'); // Remove email from session storage
      navigate('/signin'); // Redirect to the sign-in page
      window.location.reload(); // Reload the window to reset the application state
    } catch (error) {
      console.error("Logout error:", error); // Log any errors during logout
    }
  };

  return (
    <div className={`app-layout`}> {/* Main layout container */}
      <div className={`sidebar ${isOpen ? 'active' : 'sidebar-closed'}`}> {/* Sidebar with dynamic class based on isOpen state */}
        <button className="sidebar-toggle" onClick={toggleSidebar}> {/* Button to toggle sidebar visibility */}
          {isOpen ? <TiArrowLeftThick /> : <TiArrowRightThick />} {/* Display left arrow if open, right arrow if closed */}
        </button>
        <img src={image} alt="Logo" className="images" /> {/* Display logo image */}
        <ul className="sidebar-links"> {/* Unordered list for sidebar links */}
          <li>
            <Link to="/"> {/* Link to the dashboard */}
              <AiOutlineDashboard /> {isOpen && 'Dashboard'} {/* Dashboard icon and label (shown only if sidebar is open) */}
            </Link>
          </li>
          <li>
            <Link to="/settings"> {/* Link to settings page */}
              <IoSettingsOutline />{isOpen && 'Settings'} {/* Settings icon and label */}
            </Link>
          </li>
          <li>
            <Link to="/guidelines"> {/* Link to guidelines page */}
              <MdOutlineBook />{isOpen && 'Guidelines'} {/* Guidelines icon and label */}
            </Link>
          </li>
          <li>
            <button className="buttonlogout" onClick={handleLogout}> {/* Logout button */}
              <MdOutlineLogout /> {isOpen && 'Logout'} {/* Logout icon and label */}
            </button>
          </li>
        </ul>
      </div>
      <div className="content-area"> {/* Area for displaying routed content */}
        <Outlet /> {/* Render the matched child route component */}
      </div>
    </div>
  );
};

export default Sidebar; // Export the Sidebar component for use in other parts of the application
