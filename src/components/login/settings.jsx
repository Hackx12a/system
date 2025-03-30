import React, { useState, useEffect } from "react";
import { db, auth } from './firebase'; // Adjust the path as necessary
import { collection, query, where, getDocs, updateDoc, addDoc, onSnapshot, arrayUnion, doc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import "./settings.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setEmail, setSetEmail] = useState(sessionStorage.getItem('email'));
  const [loading, setLoading] = useState(false); // Loading state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); // Show/hide current password
  const [showNewPassword, setShowNewPassword] = useState(false); // Show/hide new password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Show/hide confirm password
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const q = query(collection(db, 'users'), where('email', '==', setEmail));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        setFirstName(data.FirstName || "");
        setLastName(data.LastName || "");
      });
    };

    fetchUserData();
  }, [setEmail]);

  // Function to handle saving changes
  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true); // Start loading

    try {
      // Re-authenticate user
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(setEmail, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update Firestore for FirstName and LastName
        const q = query(collection(db, 'users'), where('email', '==', setEmail));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            FirstName: firstName,
            LastName: lastName,
          });
        });

        // Update Authentication password
        await updatePassword(user, newPassword);
        alert("Profile updated successfully!");

        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error updating user: ", error);
      alert("Error updating password or user information.");
    } finally {
      setLoading(false); // Stop loading
    }
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const documentId = setEmail; 

    const messageData = {
      sender: firstName,
      email: setEmail,
      message: newMessage,
      timestamp: new Date(),
    };

    try {
      const docRef = doc(db, 'messages', documentId);
      await updateDoc(docRef, {
        messages: arrayUnion(messageData)
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
      alert("Error sending message.");
    }
  };

  // Fetch messages in real-time
  useEffect(() => {
    const docRef = doc(db, 'messages', setEmail);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      const data = doc.data();
      if (data && data.messages) {
        setMessages(data.messages);
      }
    });

    return () => unsubscribe();
  }, [setEmail]);

  const getAvatarInitials = () => {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };
  
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
          <div className="avatar">{getAvatarInitials()}</div>
            <div className="profile-info">
              <h2>{`${firstName} ${lastName}`}</h2>
              <p>{setEmail}</p>
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
            <input type="email" value={setEmail} disabled />
          </div>

         


          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      )}

        {/* Contact Administrator Chatbox */}
      {activeTab === "contact" && (
        <div className="contact-admin">
          <h3>Contact Administrator</h3>
          <div className="chatbox">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.email}:</strong> {msg.message}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type your message..." 
                required 
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default Settings;
