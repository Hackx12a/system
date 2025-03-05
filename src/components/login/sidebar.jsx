import React, { useEffect, useState } from "react";
import { MdOutlineBook } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import "./sidebar.css";
import { FaBell } from "react-icons/fa";
import { AiOutlineDashboard } from "react-icons/ai";
import { Link, Outlet } from 'react-router-dom';
import { TiArrowLeftThick } from "react-icons/ti";
import { TiArrowRightThick } from "react-icons/ti";
import { collection, getDocs } from "firebase/firestore";
import { db } from './firebase'; // Import your Firebase config

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // State to manage sidebar visibility
  const [notifications, setNotifications] = useState([]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen); // Toggle the sidebar open/close state
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "FireIncident")); // Replace with your collection name
        const flaggedIncidents = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Flagged") {
            flaggedIncidents.push(data);
          }
        });

        setNotifications(flaggedIncidents); // Set notifications to flagged incidents
      } catch (error) {
        console.error("Error fetching incidents: ", error);
      }
    };

    fetchIncidents(); // Fetch incidents when the component mounts
  }, []); // Empty dependency array to run once on mount

  return (
    <div className={`app-layout`}>
      <div className={`sidebar ${isOpen ? 'active' : 'sidebar-closed'}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isOpen ? <TiArrowLeftThick /> : <TiArrowRightThick />}
        </button>
        <ul className="sidebar-links">
          <li>
            <Link to="/">
              <AiOutlineDashboard /> {isOpen && 'Dashboard'}
            </Link>
          </li>
          <li>
            <Link to="/Settings"><IoSettingsOutline />{isOpen && 'Settings'}</Link>
          </li>
          <li>
            <Link to="/Guidelines"><MdOutlineBook />{isOpen && 'Guidelines'}</Link>
          </li>
          <li>
            <Link to="/alert" className="emergency-button">
              <FaBell /> {isOpen && `Alerts (${notifications.length})`}
            </Link>
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
