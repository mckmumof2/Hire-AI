import React from 'react';
import { PIPELINE_STAGES } from '../utils/constants';
import ScoreIndicator from './ScoreIndicator';

const PipelineBoard = ({ candidates, onMoveCandidate, onSelectCandidate }) => {
  const handleDragStart = (e, candidateId) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drop-target');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drop-target');
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    const candidateId = e.dataTransfer.getData('candidateId');
    onMoveCandidate(candidateId, stageId);
  };

  return (
    <div className="pipeline-board">
      {PIPELINE_STAGES.map((stage) => (
        <div
          key={stage.id}
          className="pipeline-column"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className="pipeline-column-header">
            <span>{stage.icon} {stage.label}</span>
            <span className="count">
              {candidates.filter(c => (c.pipelineStage || 'applied') === stage.id).length}
            </span>
          </div>
          <div className="pipeline-column-body">
            {candidates
              .filter((c) => (c.pipelineStage || 'applied') === stage.id)
              .map((candidate) => (
                <div
                  key={candidate.id}
                  className="pipeline-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, candidate.id)}
                  onClick={() => onSelectCandidate(candidate)}
                >
                  <div className="pc-name">{candidate.name}</div>
                  <div className="pc-role">{candidate.appliedRole || 'Architect'}</div>
                  <div className="pc-meta">
                    <ScoreIndicator score={candidate.aiAnalysis?.overallScore || 0} size={28} strokeWidth={2.5} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {candidate.experience || 0} Yrs
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PipelineBoard;
