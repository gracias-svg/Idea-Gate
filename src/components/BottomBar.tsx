import React from 'react';

const BottomBar: React.FC = () => {
  return (
    <div className="bottom-bar">
      <button className="pixel-btn" disabled>Save</button>
      <button className="pixel-btn" disabled>Load</button>
      <button className="pixel-btn" disabled>Run</button>
      <button className="pixel-btn" disabled>Build</button>
      <button className="pixel-btn" disabled>Help</button>
    </div>
  );
};

export default BottomBar;