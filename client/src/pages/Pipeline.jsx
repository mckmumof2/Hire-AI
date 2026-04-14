import React from 'react';
import PipelineBoard from '../components/PipelineBoard';

const Pipeline = ({ candidates, jobs, onMoveCandidate, onSelectCandidate }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Hiring Pipeline</h1>
          <div className="subtitle">Track candidates as they move from application to final selection.</div>
        </div>
      </div>

      <div className="pipeline-container">
        <PipelineBoard 
          candidates={candidates} 
          onMoveCandidate={onMoveCandidate}
          onSelectCandidate={onSelectCandidate}
        />
      </div>
    </div>
  );
};

export default Pipeline;
