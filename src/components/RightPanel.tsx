import React from 'react';

interface ActivityLog {
  time: string;
  message: string;
}

const mockActivity: ActivityLog[] = [
  { time: '12:34', message: 'Agent loaded project files' },
  { time: '12:35', message: 'Analyzing main.py structure' },
  { time: '12:36', message: 'Processing lifecycle stage 5' },
  { time: '12:37', message: 'Mock integration complete' },
  { time: '12:38', message: 'Ready for visualization' },
];

const RightPanel: React.FC = () => {
  return (
    <div className="right-panel">
      <h3 className="panel-title">Agent Activity</h3>
      <ul>
        {mockActivity.map((log, index) => (
          <li key={index} className="activity-item">
            [{log.time}] {log.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RightPanel;