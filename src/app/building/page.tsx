import React from 'react';

const mockOverviews = [
  { id: 1, name: 'Stage 1: Planning', status: 'Complete' },
  { id: 2, name: 'Stage 2: Design', status: 'In Progress' },
  { id: 3, name: 'Stage 3: Implementation', status: 'Pending' },
  { id: 4, name: 'Stage 4: Testing', status: 'Not Started' },
  { id: 5, name: 'Stage 5: Deployment', status: 'Planned' },
];

const BuildingView: React.FC = () => {
  return (
    <div className="animate-fade">
      <h3 className="panel-title">Building View (Overview)</h3>
      <ul>
        {mockOverviews.map((item) => (
          <li key={item.id} className="activity-item">
            {item.name}: <span style={{color: 'var(--accent-green)'}}>{item.status}</span>
          </li>
        ))}
      </ul>
      <p style={{fontSize: '12px', marginTop: '10px'}}>Mock project lifecycle overview for CLI system visualization.</p>
    </div>
  );
};

export default BuildingView;