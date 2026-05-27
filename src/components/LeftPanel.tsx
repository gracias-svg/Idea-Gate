'use client';

import { useData } from '@/lib/DataProvider';

export default function LeftPanel() {
  const { state, setSelectedArtifact } = useData();

  return (
    <div style={{ padding: '10px' }}>
      <h3>Artifacts Explorer</h3>

      {state.artifacts.length === 0 ? (
        <p>No artifacts available</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {state.artifacts.map((file) => (
            <li
              key={file}
              onClick={() => setSelectedArtifact(file)}
              style={{
                cursor: 'pointer',
                margin: '6px 0',
                color: state.selectedArtifact === file ? 'yellow' : 'white',
              }}
            >
              {file}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}