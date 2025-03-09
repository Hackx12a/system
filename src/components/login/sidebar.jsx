import React, { useState } from "react";
import { MdOutlineBook } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import "./sidebar.css";
import { AiOutlineDashboard } from "react-icons/ai";
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { TiArrowLeftThick, TiArrowRightThick } from "react-icons/ti";
import { auth } from './firebase'; // Import your Firebase auth
import image from './assets/helptrack.png';
import { MdOutlineLogout } from "react-icons/md";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // State to manage sidebar visibility
  const navigate = useNavigate(); // Hook for navigation

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // Toggle the sidebar open/close state
  };

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('email');
      navigate('/signin'); // Redirect to login page
      window.location.reload()
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={`app-layout`}>
      <div className={`sidebar ${isOpen ? 'active' : 'sidebar-closed'}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isOpen ? <TiArrowLeftThick /> : <TiArrowRightThick />}
        </button>
        <img src={image} alt="Logo" className="images" />
        <ul className="sidebar-links">
          <li>
            <Link to="/">
              <AiOutlineDashboard /> {isOpen && 'Dashboard'}
            </Link>
          </li>
          <li>
            <Link to="/settings"><IoSettingsOutline />{isOpen && 'Settings'}</Link>
          </li>
          <li>
            <Link to="/guidelines"><MdOutlineBook />{isOpen && 'Guidelines'}</Link>
          </li>
          <li>
            <button className="buttonlogout" onClick={handleLogout}>
              <MdOutlineLogout /> {isOpen && 'Logout'}
            </button>
          </li>
        </ul>
      </div>
      <div className="content-area">
       
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
