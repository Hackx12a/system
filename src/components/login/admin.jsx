import React, { useState, useEffect } from 'react';

import { 
  collection, getDocs, doc, updateDoc, arrayUnion, 
  serverTimestamp, setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  signOut, createUserWithEmailAndPassword, 
  sendPasswordResetEmail, deleteUser 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import { 
  FaExclamationTriangle, FaEnvelope, FaUsersCog, 
  FaEye, FaSearch, FaTrash, FaEdit, FaSignOutAlt, 
  FaReply, FaPlus, FaKey, FaCheck
} from 'react-icons/fa';
import './admin.css';
import { getFunctions, httpsCallable } from 'firebase/functions';


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('incidents');
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState({
    incidents: true,
    messages: true,
    accounts: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [incidentType, setIncidentType] = useState('Fire Incident');
  const [newAccount, setNewAccount] = useState({
    firstName: '',
    lastName: '',
    department: '',
    email: '',
    password: '',
    role: 'user'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Incidents
        const incidentsSnapshot = await getDocs(collection(db, incidentType));
        const incidentsData = incidentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedLocation: formatLocation(doc.data().location),
          formattedDate: doc.data().timestamp?.toDate().toLocaleString()
        }));
        setIncidents(incidentsData);
        setLoading(prev => ({ ...prev, incidents: false }));

        // Fetch Messages
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        const messagesData = messagesSnapshot.docs.map(doc => {
          const data = doc.data();
          const lastMessage = data.messages?.[data.messages.length - 1] || null;
          
          return {
            id: doc.id,
            ...data,
            lastMessage: lastMessage ? {
              ...lastMessage,
              timestamp: lastMessage.timestamp?.toDate ? lastMessage.timestamp.toDate() : lastMessage.timestamp
            } : null
          };
        });
        setMessages(messagesData);
        setLoading(prev => ({ ...prev, messages: false }));

        // Fetch Accounts
        const accountsSnapshot = await getDocs(collection(db, 'users'));
        setAccounts(accountsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        setLoading(prev => ({ ...prev, accounts: false }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
        setLoading({ incidents: false, messages: false, accounts: false });
      }
    };

    fetchData();
  }, [incidentType]);

  const formatLocation = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location._lat && location._long) {
      return `${location._lat.toFixed(4)}, ${location._long.toFixed(4)}`;
    }
    return 'Invalid location';
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setShowModal(true);
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      setError('Please enter a reply message');
      return;
    }
  
    try {
      const messageRef = doc(db, 'messages', selectedMessage.id);
      const adminEmail = sessionStorage.getItem('email') || 'admin@example.com';
  
      const newMessage = {
        sender: 'admin',
        email: adminEmail,
        message: replyText.trim(),
        timestamp: new Date(),
        read: false
      };
  
      await updateDoc(messageRef, {
        messages: arrayUnion(newMessage),
        updatedAt: serverTimestamp()
      });
  
      // Update local state
      setMessages(messages.map(msg => {
        if (msg.id === selectedMessage.id) {
          return {
            ...msg,
            messages: [...(msg.messages || []), newMessage],
            lastMessage: newMessage
          };
        }
        return msg;
      }));
  
      setReplyText('');
      setShowMessageModal(false);
      setError(null);
    } catch (error) {
      console.error("Reply failed:", error);
      setError(`Failed to send reply: ${error.message}`);
    }
  };

  const handleAddAccount = async () => {
    try {
      // Validate inputs
      if (!newAccount.email || !newAccount.password || 
          !newAccount.firstName || !newAccount.lastName) {
        throw new Error('Please fill all required fields');
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAccount.email,
        newAccount.password
      );

      // Add to users collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        FirstName: newAccount.firstName,
        LastName: newAccount.lastName,
        department: newAccount.department,
        email: newAccount.email,
        role: newAccount.role,
        createdAt: serverTimestamp()
      });

      // Add to messages collection (empty document)
      await setDoc(doc(db, 'messages', userCredential.user.uid), {
        email: newAccount.email,
        createdAt: serverTimestamp()
      });

      // Refresh accounts
      const accountsSnapshot = await getDocs(collection(db, 'users'));
      setAccounts(accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      setShowAddAccountModal(false);
      setNewAccount({
        firstName: '',
        lastName: '',
        department: '',
        email: '',
        password: '',
        role: 'user'
      });
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };







  const handleDeleteAccount = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${email}? This action cannot be undone.`)) {
      return;
    }
  
    try {
      // Delete from users collection
      await deleteDoc(doc(db, "users", userId));
      
      // Optional: Delete from messages collection if exists
      try {
        await deleteDoc(doc(db, "messages", userId));
      } catch (error) {
        console.log("No messages to delete for this user");
      }
      
      // Update local state
      setAccounts(accounts.filter(account => account.id !== userId));
      setError(`Account ${email} has been permanently deleted.`);
    } catch (error) {
      console.error("Delete failed:", error);
      setError(`Failed to delete account: ${error.message}`);
    }
  };



  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setError(`Password reset email sent to ${email}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      navigate('/signin');
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  const getSeverityBadgeClass = (severity) => {
    if (!severity) return 'badge-secondary';
    const severityLower = severity.toString().toLowerCase();
    switch (severityLower) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.formattedLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.lastMessage && 
      message.lastMessage.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (message.email && message.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAccounts = accounts.filter(account =>
    account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.FirstName + ' ' + account.LastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.role.toLowerCase().includes(searchTerm.toLowerCase())
  );



const handleDeleteMessage = async (messageId, email) => {
    if (!window.confirm(`Are you sure you want to delete all messages from ${email || 'this user'}?`)) {
      return;
    }
  
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      
      // Update local state
      setMessages(messages.filter(msg => msg.id !== messageId));
      
      setError(`Messages from ${email || 'the user'} have been deleted successfully.`);
      
      // Close the message modal if it's open and showing the deleted message
      if (selectedMessage && selectedMessage.id === messageId) {
        setShowMessageModal(false);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setError(`Failed to delete messages: ${error.message}`);
    }
  };



  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <h4 className="sidebar-title">Admin Panel</h4>
        <div className="sidebar-buttons">
          <button
            className={`sidebar-button ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <FaExclamationTriangle className="icon" />
            Incidents
          </button>
          <button
            className={`sidebar-button ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <FaEnvelope className="icon" />
            Messages
          </button>
          <button
            className={`sidebar-button ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <FaUsersCog className="icon" />
            Manage Accounts
          </button>
          <button
            className="sidebar-button logout-button"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="icon" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-content">
        {error && (
          <div className="alert alert-error">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="table-container">
            <div className="table-header">
              <h2 className="content-header">
                <FaExclamationTriangle className="header-icon" />
                All Incidents
              </h2>
              
              {/* Incident Type Navigation */}
              <div className="incident-type-nav">
                <button
                  className={`incident-type-btn ${incidentType === 'Fire Incident' ? 'active' : ''}`}
                  onClick={() => setIncidentType('Fire Incident')}
                >
                  Fire Incidents
                </button>
                <button
                  className={`incident-type-btn ${incidentType === 'Need Ambulance' ? 'active' : ''}`}
                  onClick={() => setIncidentType('Need Ambulance')}
                >
                  Need Ambulance
                </button>
                <button
                  className={`incident-type-btn ${incidentType === 'Road Accident' ? 'active' : ''}`}
                  onClick={() => setIncidentType('Road Accident')}
                >
                  Road Accidents
                </button>
              </div>
              <div className="search-box">
                <div className="search-input-group">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search incidents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-button">
                    <FaSearch />
                  </button>
                </div>
              </div>
            </div>

            {loading.incidents ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading incidents...</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
  {filteredIncidents.length > 0 ? (
    filteredIncidents.map((incident) => (
      <tr key={incident.id}>
        <td>{incident.id}</td>
        <td>
          <span className={`badge ${getSeverityBadgeClass(incident.severity)}`}>
            {incident.severity}
          </span>
        </td>
        <td>{incident.formattedDate}</td>
        <td>
        <a 
  href={`https://www.google.com/maps?q=${incident.location._lat},${incident.location._long}`} 
  target="_blank" 
  rel="noopener noreferrer"
>
  {incident.formattedLocation}
</a>

        </td>
        <td>{incident.status}</td>
        <td>
          <button
            className="action-button view-button"
            onClick={() => handleViewIncident(incident)}
          >
            <FaEye className="button-icon" /> View
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="6" className="no-results">
        No incidents found
      </td>
    </tr>
  )}
</tbody>
              </table>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="table-container">
            <div className="table-header">
              <h2 className="content-header">
                <FaEnvelope className="header-icon" />
                Messages
              </h2>
              <div className="search-box">
                <div className="search-input-group">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-button">
                    <FaSearch />
                  </button>
                </div>
              </div>
            </div>

            {loading.messages ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Last Message</th>
                    <th>Sender</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <tr key={message.id}>
                        <td>{message.email || message.id}</td>
                        <td className="message-preview">
                          {message.lastMessage?.message || 'No messages'}
                        </td>
                        <td>{message.lastMessage?.sender || 'Unknown'}</td>
                        <td>
                          {message.lastMessage?.timestamp ? 
                            new Date(message.lastMessage.timestamp).toLocaleString() 
                            : 'N/A'}
                        </td>
                        <td>
  <button
    className="action-button view-button"
    onClick={() => handleViewMessage(message)}
  >
    <FaEye className="button-icon" /> View/Reply
  </button>
  <button
    className="action-button delete-button"
    onClick={() => handleDeleteMessage(message.id, message.email)}
  >
    <FaTrash className="button-icon" /> Delete
  </button>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-results">
                        No messages found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="table-container">
            <div className="table-header">
              <h2 className="content-header">
                <FaUsersCog className="header-icon" />
                Manage Accounts
              </h2>
              <div className="account-actions">
                <div className="search-box">
                  <div className="search-input-group">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="search-button">
                      <FaSearch />
                    </button>
                  </div>
                </div>
                <button 
                  className="add-account-button"
                  onClick={() => setShowAddAccountModal(true)}
                >
                  <FaPlus /> Add Account
                </button>
              </div>
            </div>

            {loading.accounts ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading accounts...</p>
              </div>
            ) : (
              <table className="data-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Role</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredAccounts.map((account) => (
      <tr key={account.id}>
        <td>{account.FirstName} {account.LastName}</td>
        <td>{account.email}</td>
        <td>{account.department || 'N/A'}</td>
        <td>{account.role}</td>
        <td className="actions">
          <button
            className="action-button reset-button"
            onClick={() => handleResetPassword(account.email)}
          >
            <FaKey /> Reset Password
          </button>
          <button
            className="action-button delete-button"
            onClick={() => handleDeleteAccount(account.id, account.email)}
          >
            <FaTrash /> Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
            )}
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Incident Details: {selectedIncident?.id}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedIncident && (
                <div className="modal-row">
                  <div className="modal-column">
                    <div className="modal-section">
                      <p><strong>Severity:</strong> 
                        <span className={`badge ${getSeverityBadgeClass(selectedIncident.severity)}`}>
                          {selectedIncident.severity}
                        </span>
                      </p>
                      <p><strong>Timestamp:</strong> {selectedIncident.formattedDate}</p>
                      <p><strong>Location:</strong> {selectedIncident.formattedLocation}</p>
                      <p><strong>Status:</strong> {selectedIncident.status}</p>
                    </div>
                    <div className="modal-section">
                      <p><strong>Description:</strong></p>
                      <div className="description-box">
                        {selectedIncident.description || 'No description available'}
                      </div>
                    </div>
                  </div>
                  <div className="modal-column">
                    <h4>Incident Image:</h4>
                    {selectedIncident.image ? (
                      <div className="image-container">
                        <img
                          src={selectedIncident.image}
                          alt="Incident"
                          className="incident-image"
                        />
                      </div>
                    ) : (
                      <div className="no-image">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button close-button"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                Conversation {selectedMessage?.id ? `(#${selectedMessage.id})` : ''}
              </h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedMessage ? (
                <>
                  <div className="message-thread">
                    {selectedMessage.messages?.length > 0 ? (
                      selectedMessage.messages.map((msg, index) => {
                        const timestamp = msg.timestamp ? 
                          (typeof msg.timestamp.toDate === 'function' ? 
                            msg.timestamp.toDate() : 
                            new Date(msg.timestamp)) : 
                          null;
                        
                        return (
                          <div 
                            key={index} 
                            className={`message-bubble ${
                              msg.sender === 'admin' ? 'admin-message' : 'user-message'
                            }`}
                          >
                            <div className="message-header">
                              <strong>
                                {msg.sender === 'admin' ? 'You' : msg.email || 'Unknown User'}
                              </strong>
                              <span className="message-time">
                                {timestamp ? timestamp.toLocaleString() : 'Unknown time'}
                              </span>
                            </div>
                            <p className="message-content">{msg.message}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-messages">No messages in this thread</div>
                    )}
                  </div>

                  <div className="reply-section">
                    <label className="reply-label">Your Reply:</label>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="reply-textarea"
                    />
                    {error && <div className="reply-error">{error}</div>}
                  </div>
                </>
              ) : (
                <div className="loading-conversation">
                  <div className="spinner"></div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button close-button"
                onClick={() => setShowMessageModal(false)}
              >
                Close
              </button>
              <button 
                className="modal-button send-button"
                onClick={handleSendReply}
                disabled={!replyText.trim() || !selectedMessage}
              >
                <FaReply className="button-icon" /> Send Reply
              </button>
              <button 
  className="modal-button delete-button"
  onClick={() => handleDeleteMessage(selectedMessage.id, selectedMessage.email)}
>
  <FaTrash className="button-icon" /> Delete Conversation
</button>
              
            </div>
            
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Account</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowAddAccountModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name*</label>
                <input
                  type="text"
                  value={newAccount.firstName}
                  onChange={(e) => setNewAccount({...newAccount, firstName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Last Name*</label>
                <input
                  type="text"
                  value={newAccount.lastName}
                  onChange={(e) => setNewAccount({...newAccount, lastName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={newAccount.department}
                  onChange={(e) => setNewAccount({...newAccount, department: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email*</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Password*</label>
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newAccount.role}
                  onChange={(e) => setNewAccount({...newAccount, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button cancel-button"
                onClick={() => setShowAddAccountModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button save-button"
                onClick={handleAddAccount}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;