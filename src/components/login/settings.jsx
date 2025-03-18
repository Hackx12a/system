import React, { useState } from "react";
import "./settings.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user");
  const [firstName, setFirstName] = useState("Prince Albert");
  const [lastName, setLastName] = useState("Martinez");
  const [email, setEmail] = useState("Albertgwapo@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  return (
    <div className="settings-container">
      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={activeTab === "user" ? "active" : ""}
          onClick={() => setActiveTab("user")}
        >
          User
        </button>
        <button 
          className={activeTab === "contact" ? "active" : ""}
          onClick={() => setActiveTab("contact")}
        >
          Contact Administrator
        </button>
      </div>

      {/* User Settings Form */}
      {activeTab === "user" && (
        <div className="user-settings">
          <div className="profile-header">
            <div className="avatar">FP</div>
            <div className="profile-info">
              <h2>Prince Albert Martinez</h2>
              <p>fire department</p>
            </div>
          </div>

          <div className="input-group">
            <label>First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} disabled />
          </div>

          <div className="input-group">
            <label>New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <button className="save-btn">Save</button>
        </div>
      )}

      {/* Contact Administrator Form */}
      {activeTab === "contact" && (
        <div className="contact-admin">
          <h3>Contact Administrator</h3>
          <p>If you have any issues, please reach out to the administrator.</p>

          <div className="input-group">
            <label>Message</label>
            <textarea 
              placeholder="Type your message here..." 
              value={adminMessage} 
              onChange={(e) => setAdminMessage(e.target.value)}
            ></textarea>
          </div>

          <div className="input-group">
            <label>Your Name</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={adminName} 
              onChange={(e) => setAdminName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Your Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          <button className="save-btn">Send Message</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
