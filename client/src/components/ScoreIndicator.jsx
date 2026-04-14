import React from 'react';
import { getScoreClass } from '../utils/constants';

const ScoreIndicator = ({ score, size = 42, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const scoreClass = getScoreClass(score);

  return (
    <div className={`score-ring ${scoreClass}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="score-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-value">{score}</span>
    </div>
  );
};

export default ScoreIndicator;
