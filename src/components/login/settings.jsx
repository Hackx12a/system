import React, { useState } from 'react';


const Settings = () => {
  const [collectionNames, setCollectionNameS]=useState("FireIncident");
  

  return (
      <div>
        <title>Settings</title>

          <h2>{collectionNames}</h2>
      </div>
  );
};



export default Settings;
