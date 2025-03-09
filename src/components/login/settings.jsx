import React, { useState } from 'react';


const Settings = () => {
  const [collectionNames, setCollectionNameS]=useState("FireIncident");
  

  return (
      <div>

          <h2>{collectionNames}</h2>
      </div>
  );
};



export default Settings;
